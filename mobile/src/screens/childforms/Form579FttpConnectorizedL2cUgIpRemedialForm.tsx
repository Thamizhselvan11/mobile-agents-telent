import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { GenericChecklistFormScreen } from '../../components/GenericChecklistFormScreen';
import { FORM_579_FTTP_CONNECTORIZED_L2C_UG_IP_REMEDIAL_FIELDS } from '../../data/childFormFields';

type Props = NativeStackScreenProps<RootStackParamList, 'Form579FttpConnectorizedL2cUgIpRemedialForm'>;

/**
 * Form 579 - FTTP Connectorized L2C UG IP & Remedial
 * Single-section child form (AC32). All fields use the shared
 * ChecklistItemWithPhoto Bottom-DialogBox pattern (AC22/AC28); the first
 * field is this form's one mandatory question (AC27).
 */
export default function Form579FttpConnectorizedL2cUgIpRemedialForm({ route }: Props) {
  const { auditId, orderNumber, parentFormID, childFormID } = route.params;
  return (
    <GenericChecklistFormScreen
      config={{
        title: 'Form 579 - FTTP Connectorized L2C UG IP & Remedial',
        sectionName: 'FTTP CONNECTORIZED L2C UG IP & REMEDIAL',
        fields: FORM_579_FTTP_CONNECTORIZED_L2C_UG_IP_REMEDIAL_FIELDS,
        mandatoryIndex: 0,
      }}
      routeParams={{ auditId, orderNumber, parentFormID, childFormID }}
    />
  );
}
