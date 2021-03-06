import { computed, defineComponent, ref } from 'vue';
import { VBtn, VTextField, VSpacer, VRow, VCol } from 'vuetify/components';
import { useAccountStore } from '@/stores/account';
import { storeToRefs } from 'pinia';
import { useNotify } from '@/composable/notify';

export const AccountCreatePassword = defineComponent({
  emits: [
    'click:restart',

    'accountCreated',
    'accountFailed'
  ],

  setup(props, { emit }) {
    const accountStore = useAccountStore();
    const { addAccount } = accountStore;
    const { tempSeed } = storeToRefs(accountStore);
    const { showError, showSuccess } = useNotify();

    const password = ref('');
    const passwordRepeat = ref('');

    const passwordLength = 6;

    const notFilled = computed(() => !(password.value && passwordRepeat.value));
    const isShort = computed(() => password.value.length < passwordLength);
    const notEqual = computed(() => password.value !== passwordRepeat.value);

    const disabled = computed(() => notFilled.value || isShort.value || notEqual.value);

    const rules = {
      equal: (value: string) => value === password.value || 'Passwords do not match.',
      length: (value: string) => value.length >= passwordLength || 'Password is too short'
    };

    const addNewAccount = (): void => {
      try {
        addAccount(tempSeed.value, password.value);

        emit('accountCreated');
        showSuccess('Account succesfuly created');

        tempSeed.value = '';

      } catch (err) {
        let errMessage = 'Unknown Error';
        if (err instanceof Error) errMessage = err.message;

        emit('accountFailed');
        showError(errMessage);
      }
    };

    return () => (
      <>
        <div class="text-h3 mb-6">
          Set password
        </div>

        <div class="text-body-large mb-12">
          DEIP Wallet is a secure wallet and account manager
          for your accounts on the DEIP blockchain.
        </div>

        <VRow>
          <VCol>
            <VTextField
              label="Password"
              v-model={password.value}
              rules={[rules.length]}
            />
          </VCol>
          <VCol>
            <VTextField
              label="Repeat password"
              v-model={passwordRepeat.value}
              rules={[rules.equal]}
            />
          </VCol>
        </VRow>

        <div class="d-flex mt-6">
          <VSpacer/>

          <VBtn
            color="secondary-btn"
            onClick={() => emit('click:restart')}
          >
            Start Again
          </VBtn>

          <VBtn
            class="ml-4"
            disabled={disabled.value}
            onClick={addNewAccount}
          >
            Add Account
          </VBtn>
        </div>
      </>
    );
  }
});
