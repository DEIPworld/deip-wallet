import { defineComponent, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { VSheet, VBtn } from 'vuetify/components';

import { useMultisigWalletStore } from '@/stores/multisig';

import { ApprovalDetailsModal } from './ApprovalDetailsModal';

export const MultisigApprovals = defineComponent({
  setup() {
    const multisigStore = useMultisigWalletStore();
    const { pendingApprovals } = storeToRefs(multisigStore);

    const isOpen = ref<boolean>(false);

    const renderApprovalsList = () =>
      pendingApprovals.value.map(() => (
        <VSheet
          rounded
          color="rgba(255,255,255,.1)"
          class="mt-4 pa-4 d-flex justify-space-between align-center"
        >
          <span class="text-h6">pending call hash</span>
          <VBtn
            rounded={false}
            size="small"
            color={'secondary-btn'}
            onClick={() => (isOpen.value = true)}
          >
            View
          </VBtn>
        </VSheet>
      ));

    return () => (
      <>
        {renderApprovalsList()}
        <ApprovalDetailsModal
          isOpen={isOpen.value}
          pendingApproval={{}}
          onClick:cancel={() => (isOpen.value = false)}
        />
      </>
    );
  }
});