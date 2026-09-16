import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { GenericChecklistFormScreen } from '../../components/GenericChecklistFormScreen';
import { FORM_503_OH_CABLING_FIELDS } from '../../data/childFormFields';

type Props = NativeStackScreenProps<RootStackParamList, 'Form503OhCablingForm'>;

/**
 * Form 503 - OH CABLING
 * Single-section child form (AC32). All fields use the shared
 * ChecklistItemWithPhoto Bottom-DialogBox pattern (AC22/AC28); the first
 * field is this form's one mandatory question (AC27).
 */
export default function Form503OhCablingForm({ route }: Props) {
  const { auditId, orderNumber, parentFormID, childFormID } = route.params;
  return (
    <GenericChecklistFormScreen
      config={{
        title: 'Form 503 - OH CABLING',
        sectionName: 'OH CABLING',
        fields: FORM_503_OH_CABLING_FIELDS,
        mandatoryIndex: 0,
      }}
      routeParams={{ auditId, orderNumber, parentFormID, childFormID }}
    />
  );
}
