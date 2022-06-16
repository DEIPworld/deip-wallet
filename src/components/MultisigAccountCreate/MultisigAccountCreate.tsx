import { defineComponent, ref } from 'vue';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useField, useForm } from 'vee-validate';
import { array, string, number, object, ref as yupRef } from 'yup';

import { VBtn, VTextField, VChip } from 'vuetify/components';
import { InnerContainer } from '@/components/InnerContainer';

import { useAccountStore } from '@/stores/account';
import { useYup } from '@/composable/validate';
import { useNotify } from '@/composable/notify';

import { AddSignatoryModal } from './AddSignatoryModal';

import type { ISignatory } from '../../../types';

export const MultisigAccountCreate = defineComponent({
  setup() {
    const accountStore = useAccountStore();
    const { address } = storeToRefs(accountStore);

    const { makeError, addressValidator, tresholdValidator } = useYup();
    const { showSuccess } = useNotify();
    const router = useRouter();

    const signatorySchema = object({
      address: string().test(addressValidator).required().label('Address'),
      name: string().required().label('Name')
    });

    const schema = object({
      treshold: number().required().min(1).test(tresholdValidator).label('Treshold'),
      name: string().required().label('Multisig account name'),
      signatories: array().of(signatorySchema).ensure().min(1).label('Signatories')
    });

    const { meta: formState } = useForm({
      validationSchema: schema
    });

    const { value: treshold, errorMessage: tresholdError } = useField<string>('treshold');
    const { value: name, errorMessage: nameError } = useField<number>('name');
    const { value: signatories } = useField<Array<ISignatory>>('signatories');

    const isAddSignatoryModalOpen = ref<boolean>(false);
    const signatoryError = ref<string>();

    const onAddSignatory = (signatory: ISignatory): void => {
      if (signatories.value?.some((item) => item.address === signatory.address)) {
        signatoryError.value = 'Address is already added';
        return;
      }

      if (signatory.address === address.value) {
        signatoryError.value = 'Your address is added by default';
        return;
      }

      isAddSignatoryModalOpen.value = false;
      signatories.value = (signatories.value || []).concat(signatory);
    };

    const onRemoveSignatory = (address: string): void => {
      signatories.value = signatories.value.filter((item) => item.address !== address);
    };

    const onConfirm = (): void => {
      // TODO: prepare data and send it
      showSuccess('Multisig account succesfuly created');
      router.push({ name: 'multisig' });
    };

    const renderSignatories = () =>
      signatories.value?.map((item) => (
        <VChip
          class="mr-2 mb-2"
          density="compact"
          closable
          onClick:close={() => onRemoveSignatory(item.address)}
        >
          {item.name}
        </VChip>
      ));

    return () => (
      <>
        <InnerContainer>
          <div>
            <div class="text-h6 mb-2">Add multisig account</div>
            <div class="text-body-large">
              The signatories have the ability to create transactions using the multisig and TBD
            </div>
          </div>

          <div class="mt-12">
            <VBtn
              color="secondary-btn"
              onClick={() => (isAddSignatoryModalOpen.value = true)}
              size="small"
              rounded={false}
            >
              Add signatory
            </VBtn>
          </div>
          <div class="d-flex flex-wrap align-center mt-4 mw-">
            <VChip class="mr-2 mb-2" density="compact">
              You
            </VChip>
            {renderSignatories()}
          </div>

          <div class="mt-12">
            <VTextField
              label="Treshold"
              v-model={treshold.value}
              {...makeError(tresholdError.value)}
            />
            <VTextField
              label="Multisig account name"
              v-model={name.value}
              {...makeError(nameError.value)}
            />
          </div>

          <div class="d-flex align-center justify-end mt-4">
            <VBtn color="secondary-btn" to={{ name: 'wallet' }} size="small">
              cancel
            </VBtn>
            <VBtn class="ml-2" disabled={!formState.value.valid} onClick={onConfirm} size="small">
              Create
            </VBtn>
          </div>
        </InnerContainer>

        <AddSignatoryModal
          isOpen={isAddSignatoryModalOpen.value}
          signatorySchema={signatorySchema}
          signatoryError={signatoryError.value}
          onClick:cancel={() => (isAddSignatoryModalOpen.value = false)}
          onClick:confirm={onAddSignatory}
        />
      </>
    );
  }
});