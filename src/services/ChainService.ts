import BigNumber from 'bignumber.js';
import Keyring from '@polkadot/ui-keyring';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { waitReady } from '@polkadot/wasm-crypto';
import { mnemonicGenerate, mnemonicValidate } from '@polkadot/util-crypto';

import type { IAccount, IVestingPlan, ITransaction } from '../../types';
import type { CreateResult } from '@polkadot/ui-keyring/types';
import type { KeyringPair$Json, KeyringPair } from '@polkadot/keyring/types';

import { singleton } from '@/utils/singleton';
import { emitter } from '@/utils/eventBus';
import type { BN } from '@polkadot/util';
import type { AccountInfo } from '@polkadot/types/interfaces/system/types';

export class ChainService {
  // this.api.consts
  // All runtime constants, e.g. this.api.consts.balances.existentialDeposit.
  // These are not functions, rather accessing the endpoint immediately
  // yields the result as defined.
  //
  // this.api.query
  // All chain state, e.g. this.api.query.system.account(accountId).
  //
  // this.api.tx
  // All extrinsics, e.g. this.api.tx.balances.transfer(accountId, value).
  // private api: ApiDecoration<ApiTypes> | any;
  private api: any;

  private static formatCurrency(currency: number | BN, negated = false): string {
    const rawNum = new BigNumber(currency as BigNumber.Value).shiftedBy(-18);
    const resNum = negated ? rawNum.negated() : rawNum;

    return resNum.toFormat(BigNumber.ROUND_FLOOR);
  }

  private static millisecondsToMonth(milliseconds: number): number {
    return Math.floor(milliseconds / 2.628e+9);
  }

  async loadApi(): Promise<void> {
    try {
      const provider = new WsProvider(import.meta.env.DW_NETWORK);
      this.api = await ApiPromise.create({ provider });
    } catch (error) {
      console.log('Unable to initiate an API service: ', error);
    }
  }

  // Must be initiated after *loadApi() call
  // In terms to handle a Keyring api to load the plain account
  loadKeyring(): void {
    try {
      Keyring.loadAll({
        ss58Format: 42,
        type: 'sr25519',
        isDevelopment: import.meta.env.DEV
      });
    } catch (error) {
      console.error('Unable to load Keyring. ', error);
    }
  }

  async init(): Promise<void> {
    await waitReady();
    await this.loadApi();
    this.loadKeyring();
  }

  // ////////////////////////

  generateSeedPhrase(numWords: 12 | 15 | 18 | 21 | 24 | undefined = 12): string {
    return mnemonicGenerate(numWords);
  }

  validateSeedPhrase(seedPhrase: string): boolean {
    return mnemonicValidate(seedPhrase);
  }

  addAccount(seedPhrase: string, password: string): CreateResult {
    if (this.validateSeedPhrase(seedPhrase)) {
      return Keyring.addUri(seedPhrase, password);
    }

    throw new Error(`The seed phrase "${seedPhrase}" is not valid`);
  }

  async restoreAccount(json: KeyringPair$Json, password: string): Promise<CreateResult> {
    return new Promise((resolve, reject) => {
      try {
        const pair: KeyringPair = Keyring.restoreAccount(json, password);

        const restoredAccount = Keyring.addPair(pair, password);
        resolve(restoredAccount);
      } catch (error) {
        reject(new Error('password is incorrect'));
      }
    });
  }

  transformAccountInfo(data: AccountInfo) {
    const calculateActualBalance = Number(data.data.free) - Number(data.data.feeFrozen);

    return {
      nonce: data.nonce.toNumber(),
      consumers: data.consumers.toNumber(),
      providers: data.providers.toNumber(),
      sufficients: data.sufficients.toNumber(),
      data: {
        free: ChainService.formatCurrency(data.data.free),
        reserved: ChainService.formatCurrency(data.data.reserved),
        miscFrozen: ChainService.formatCurrency(data.data.miscFrozen),
        feeFrozen: ChainService.formatCurrency(data.data.feeFrozen),
        actual: ChainService.formatCurrency(calculateActualBalance)
      }
    };
  }

  // ////////////////////////

  async getVestingPlan(address: string): Promise<IVestingPlan> {
    try {
      const { value } = await this.api.query.deipVesting.vestingPlans(address);

      return {

        // Duration of cliff, not allowed to withdraw
        cliffDuration: ChainService.millisecondsToMonth(Number(value.cliffDuration)),

        // Amount of tokens which will be released at startTime
        initialAmount: ChainService.formatCurrency(value.initialAmount),

        // Vesting interval (availability for the next unlock)
        interval: ChainService.millisecondsToMonth(Number(value.interval)),

        // Starting time for unlocking (vesting)
        startTime: Number(value.startTime),

        // End time of vesting period
        endTime: Number(value.startTime) + Number(value.totalDuration),

        // Total locked amount, including the initialAmount
        totalAmount: ChainService.formatCurrency(value.totalAmount),

        // Total duration of this vesting plan (in time)
        totalDuration: ChainService.millisecondsToMonth(Number(value.totalDuration)),

        // True if vesting amount is accumulated during cliff duration
        vestingDuringCliff: Boolean(value.vestingDuringCliff)

      };
    } catch (error) {
      console.error(error);
      return error as any;
    }
  }

  async claimVesting(account: CreateResult): Promise<string> {
    try {
      const hash = await this.api.tx.deipVesting
        .unlock()
        .signAndSend(account.pair);

      return hash.toString();
    } catch (error) {
      console.error(error);
      return error as any;
    }
  }

  async getAccountBalance(address: string): Promise<IAccount> {
    try {
      const res = await this.api.query.system.account(address);

      return this.transformAccountInfo(res);
    } catch (error) {
      console.error(error);
      return error as any;
    }
  }

  async getTransactionFee(
    recipient: string,
    address: string,
    amount: number
  ): Promise<string> {
    try {
      const { partialFee } = await this.api.tx.balances
        .transfer(recipient, amount)
        .paymentInfo(address);

      return ChainService.formatCurrency(partialFee);
    } catch (error) {
      console.error(error);
      return error as any;
    }
  }

  async makeTransaction(
    recipient: string,
    account: CreateResult,
    amount: number
  ): Promise<ITransaction> {

    try {
      const hash = await this.api.tx.balances
        .transfer(recipient, new BigNumber(amount).shiftedBy(18).toString())
        .signAndSend(account.pair);

      return {
        hash: hash.toHex(),
        to: recipient,
        date: new Date().getTime(),
        amount
      };
    } catch (error) {
      console.error(error);
      return error as any;
    }
  }

  subscribeToBalance(address: string): void {
    try {
      this.api.query.system.account(address, (data: AccountInfo) => {
        emitter.emit(
          'wallet:balanceChange',
          this.transformAccountInfo(data)
        );
      });
    } catch (error) {
      console.error(error);
    }
  }

  subscribeToTransfers(address: string): void {
    try {
      this.api.rpc.chain.subscribeFinalizedHeads(
        async (header: any) => {

          const [{ block }, records] = await Promise.all([
            this.api.rpc.chain.getBlock(header.hash),
            this.api.query.system.events.at(header.hash)
          ]);

          block.extrinsics.forEach((extrinsic: any, index: any) => {
            // Retrieve all events for this extrinsic
            const events = records.filter(
              ({ phase }: any) => phase.isApplyExtrinsic && phase.asApplyExtrinsic.eq(index)
            );

            // Search if it is a transfer
            events.forEach(({ event }: any) => {
              const [sender, recipient, amount] = event.data;

              const isDeposit = recipient && recipient.toString() === address;
              const isWithdraw = sender && sender.toString() === address;

              const relatedTransfer = isDeposit || isWithdraw;

              if (event.method === 'Transfer' && relatedTransfer) {
                emitter.emit('wallet:transfer', {
                  hash: extrinsic.hash.toString(),
                  from: sender.toString(),
                  date: new Date().getTime(),
                  amount: ChainService.formatCurrency(amount, isWithdraw)
                });
              }
            });
          });
        }
      );
    } catch (error) {
      console.error(error);
    }
  }

  static readonly getInstance = singleton(() => new ChainService());

}