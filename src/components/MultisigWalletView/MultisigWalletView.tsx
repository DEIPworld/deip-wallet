import { defineComponent, computed } from 'vue';
import { RouterView, useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';

import { VBtn, VBadge, VDivider, VTab, VTabs } from 'vuetify/components';
import { InnerContainer } from '@/components/InnerContainer';
import { DisplayAddress } from '@/components/DisplayAddress';

import { useAccountStore } from '@/stores/account';
import { useMultisigWalletStore } from '@/stores/multisigWallet';
import { useVestingStore } from '@/stores/vesting';

export const MultisigWalletView = defineComponent({
  props: {
    address: {
      type: String,
      required: true
    }
  },
  setup(props) {
    const route = useRoute();

    const accountStore = useAccountStore();
    const multisigStore = useMultisigWalletStore();
    const vestingStore = useVestingStore();

    const { multisigAccountDetails } = storeToRefs(accountStore);
    const { balance, pendingApprovals: pendingTransactions } = storeToRefs(multisigStore);
    const { pendingApprovals: pendingVestingClaims } = storeToRefs(vestingStore);

    const pendingApprovals = computed(
      () => (pendingTransactions.value?.length || 0) + (pendingVestingClaims.value?.length || 0)
    );

    const activeTab = computed(() => {
      switch(route.name) {
        case 'multisig.balances':
          return 'balances';
        case 'multisig.transactions':
          return 'transactions';
        case 'multisig.approvals':
        case 'multisig.approvalDetails':
          return 'approvals';
        default: return 'wallet';
      }
    });

    return () => (
      <InnerContainer>
        <div class="d-flex justify-space-between mb-4">
          <div>
            <div class="text-h3 mb-2">{multisigAccountDetails.value?.name}</div>
            <DisplayAddress address={props.address} />
          </div>

          <div class="text-right">
            <div class="text-h4 mt-1 mb-3">{balance.value?.data.actual} DEIP</div>
            <div>
              <VBtn size="small" color="primary" to={{ name: 'multisig.action.send' }}>
                Send
              </VBtn>

              <VBtn size="small" color={'secondary-btn'} class={'ml-2'}>
                Edit
              </VBtn>
            </div>
          </div>
        </div>

        <VTabs class="mx-n6" style="height: 64px" modelValue={activeTab.value}>
          <VTab
            style="height: auto"
            value="balances"
            to={{ name: 'multisig.balances', params: { address: props.address } }}
          >
            assets
          </VTab>
          <VTab
            style="height: auto"
            value="transactions"
            to={{ name: 'multisig.transactions', params: { address: props.address } }}
          >
            transactions
          </VTab>
          <VTab
            style="height: auto"
            value="approvals"
            to={{ name: 'multisig.approvals', params: { address: props.address } }}
          >
            <span>approvals</span>
            {pendingApprovals.value > 0 && (
              <VBadge
                class="ml-2"
                inline
                content={pendingApprovals.value}
                textColor="white"
                color="#f44336"
              />
            )}
          </VTab>
        </VTabs>

        <VDivider class="mx-n12 mb-12" />

        <RouterView />
      </InnerContainer>
    );
  }
});
