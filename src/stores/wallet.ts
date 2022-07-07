import { computed, ref } from 'vue';
import { defineStore } from 'pinia';

import { ApiService } from '@/services/ApiService';
import HttpService from '@/services/HttpService';
import { emitter } from '@/utils/eventBus';

import type { IAccount, ITransaction, ITransactionHistoryItem } from '@/types';
import type { KeyringPair$Json } from '@polkadot/keyring/types';
import type { CreateResult } from '@polkadot/ui-keyring/types';

const apiService = ApiService.getInstance();

export const useWalletStore = defineStore('balance', () => {
  const balance = ref<IAccount | undefined>();
  const transactions = ref<ITransaction[]>([]);
  const transactionHistory = ref<ITransactionHistoryItem[]>([]);

  const freeBalance = computed(() =>
    parseFloat(balance.value?.data.free.replace(',', '') || '')
  );
  const actualBalance = computed(() =>
    parseFloat(balance.value?.data.actual.replace(',', '') || '')
  );

  const clear = () => {
    balance.value = undefined;
    transactions.value = [];
  };

  // theoretically not required
  const getAccountBalance = async (address: string | undefined): Promise<void> => {
    if (address) {
      const res = await apiService.getAccountBalance(address);
      if (res) balance.value = res;
    }
  };

  const getTransactionHistory = async (data: { address: string, page: number }): Promise<void> => {
    const { data: result } = await HttpService.get('/transaction-history', data);

    if (result) {
      data.page > 1
        ? transactionHistory.value = transactionHistory.value.concat(result)
        : transactionHistory.value = result;
    }
  };

  const subscribeToBalance = async (address: string) => {
    apiService.subscribeToBalance(address);

    emitter.on('wallet:balanceChange', (data: IAccount) => {
      balance.value = data;
    });
  };

  const subscribeToTransfers = (address: string) => {
    apiService.subscribeToTransfers(address);

    emitter.on(`wallet:transfer:${address}`, (data: ITransaction) => {
      transactions.value.push(data);
    });
  };

  const subscribeToUpdates = (address: string) => {
    subscribeToBalance(address);
    subscribeToTransfers(address);
  };

  const getTransactionFee = async (
    recipient: string,
    address: string,
    amount: number
  ) => {
    return await apiService.getTransactionFee(
      recipient,
      address,
      amount
    );
  };

  const makeTransaction = async (
    recipient: string,
    sender: {
      account: KeyringPair$Json,
      password: string,
    },
    amount: number
  ) => {
    const {
      account,
      password
    } = sender;

    const restoredAccount: CreateResult = await apiService.restoreAccount(account, password);

    return await apiService.makeTransaction(
      recipient,
      restoredAccount,
      amount
    );
  };

  return {
    balance,
    freeBalance,
    actualBalance,

    transactions,
    transactionHistory,

    getAccountBalance,
    getTransactionHistory,
    getTransactionFee,
    makeTransaction,

    subscribeToUpdates,
    subscribeToBalance,
    subscribeToTransfers,

    clear
  };
}, {
  persistedState: {
    key: 'DEIP:wallet',
    includePaths: ['balance']
  }
});
