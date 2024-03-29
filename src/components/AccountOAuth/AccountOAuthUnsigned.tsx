import { defineComponent } from 'vue';
import { VBtn, VSpacer } from 'vuetify/components';

export const AccountOAuthUnsigned = defineComponent({
  emits: [
    'click:import',
    'click:create'
  ],

  setup(props, { emit }) {
    return () => (
      <>
        <div class="text-h3 mb-6">
          No active session in the wallet
        </div>

        <div class="text-body-large mb-12">
          To grant access to the Portal, you must be authenticated.
        </div>

        <div class="d-flex mt-12">
          <VSpacer/>

          <VBtn
            color="secondary-btn"
            onClick={() => emit('click:import')}
          >
            Import existing account
          </VBtn>
          <VBtn
            class="ml-4"
            onClick={() => emit('click:create')}
          >
            Create account
          </VBtn>
        </div>
      </>
    );
  }

});
