import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { GenericChecklistFormScreen } from '../../components/GenericChecklistFormScreen';
import { FORM_570_OFN_FTTP_FIELDS } from '../../data/childFormFields';

type Props = NativeStackScreenProps<RootStackParamList, 'Form570OfnFttpForm'>;

/**
 * Form 570 - OFN FTTP
 * Single-section child form (AC32). All fields use the shared
 * ChecklistItemWithPhoto Bottom-DialogBox pattern (AC22/AC28); the first
 * field is this form's one mandatory question (AC27).
 */
export default function Form570OfnFttpForm({ route }: Props) {
  const { auditId, orderNumber, parentFormID, childFormID } = route.params;
  return (
    <GenericChecklistFormScreen
      config={{
        title: 'Form 570 - OFN FTTP',
        sectionName: 'OFN FTTP',
        fields: FORM_570_OFN_FTTP_FIELDS,
        mandatoryIndex: 0,
      }}
      routeParams={{ auditId, orderNumber, parentFormID, childFormID }}
    />
  );
}
