import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { GenericChecklistFormScreen } from '../../components/GenericChecklistFormScreen';
import { FORM_411_PRECISION_TEST_FIELDS } from '../../data/childFormFields';

type Props = NativeStackScreenProps<RootStackParamList, 'Form411PrecisionTestForm'>;

/**
 * Form 411 - PRECISION TEST
 * Single-section child form (AC32). All fields use the shared
 * ChecklistItemWithPhoto Bottom-DialogBox pattern (AC22/AC28); the first
 * field is this form's one mandatory question (AC27).
 */
export default function Form411PrecisionTestForm({ route }: Props) {
  const { auditId, orderNumber, parentFormID, childFormID } = route.params;
  return (
    <GenericChecklistFormScreen
      config={{
        title: 'Form 411 - PRECISION TEST',
        sectionName: 'PRECISION TEST',
        fields: FORM_411_PRECISION_TEST_FIELDS,
        mandatoryIndex: 0,
      }}
      routeParams={{ auditId, orderNumber, parentFormID, childFormID }}
    />
  );
}
