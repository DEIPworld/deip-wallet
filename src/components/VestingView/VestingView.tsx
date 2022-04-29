import { defineComponent } from 'vue';
import { useAccountStore } from '@/stores/account';
import { storeToRefs } from 'pinia';
import { VBtn } from 'vuetify/components';
import { RouterView } from 'vue-router';
import { InnerContainer } from '@/components/InnerContainer';
import { useVestingStore } from '@/stores/vesting';
import { DisplayAddress } from '@/components/DisplayAddress/DisplayAddress';


export const VestingView = defineComponent({
  setup() {
    const accountStore = useAccountStore();
    const { address } = storeToRefs(accountStore);

    const vestingStore = useVestingStore();
    const { vesting } = storeToRefs(vestingStore);


    return () => (
      <InnerContainer>
        <div class="d-flex justify-space-between mb-6">
          <div>
            <div class="text-h3 mb-2">Vesting contract</div>
            <DisplayAddress address={address.value} />
          </div>

          <div class="text-right">
            <VBtn size="small" color={'primary'}>claim</VBtn>
            <div class="text-body-1">Next claim available on 22.12.2022</div>
          </div>
        </div>

        <RouterView/>
      </InnerContainer>
    );
  }
});
