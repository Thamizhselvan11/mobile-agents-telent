import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { GenericChecklistFormScreen } from '../../components/GenericChecklistFormScreen';
import { FORM_401_E_SIDE_IP_FIELDS } from '../../data/childFormFields';

type Props = NativeStackScreenProps<RootStackParamList, 'Form401ESideIpForm'>;

/**
 * Form 401 - E SIDE IP
 * Single-section child form (AC32). All fields use the shared
 * ChecklistItemWithPhoto Bottom-DialogBox pattern (AC22/AC28); the first
 * field is this form's one mandatory question (AC27).
 */
export default function Form401ESideIpForm({ route }: Props) {
  const { auditId, orderNumber, parentFormID, childFormID } = route.params;
  return (
    <GenericChecklistFormScreen
      config={{
        title: 'Form 401 - E SIDE IP',
        sectionName: 'E SIDE IP',
        fields: FORM_401_E_SIDE_IP_FIELDS,
        mandatoryIndex: 0,
      }}
      routeParams={{ auditId, orderNumber, parentFormID, childFormID }}
    />
  );
}
