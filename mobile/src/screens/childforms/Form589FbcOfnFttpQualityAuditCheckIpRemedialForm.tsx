import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { GenericChecklistFormScreen } from '../../components/GenericChecklistFormScreen';
import { FORM_589_FBC_OFN_FTTP_QUALITY_AUDIT_CHECK_IP_REMEDIAL_FIELDS } from '../../data/childFormFields';

type Props = NativeStackScreenProps<RootStackParamList, 'Form589FbcOfnFttpQualityAuditCheckIpRemedialForm'>;

/**
 * Form 589 - FBC - OFN FTTP quality audit check IP & Remedial
 * Single-section child form (AC32). All fields use the shared
 * ChecklistItemWithPhoto Bottom-DialogBox pattern (AC22/AC28); the first
 * field is this form's one mandatory question (AC27).
 */
export default function Form589FbcOfnFttpQualityAuditCheckIpRemedialForm({ route }: Props) {
  const { auditId, orderNumber, parentFormID, childFormID } = route.params;
  return (
    <GenericChecklistFormScreen
      config={{
        title: 'Form 589 - FBC - OFN FTTP quality audit check IP & Remedial',
        sectionName: 'FBC - OFN FTTP QUALITY AUDIT CHECK IP & REMEDIAL',
        fields: FORM_589_FBC_OFN_FTTP_QUALITY_AUDIT_CHECK_IP_REMEDIAL_FIELDS,
        mandatoryIndex: 0,
      }}
      routeParams={{ auditId, orderNumber, parentFormID, childFormID }}
    />
  );
}
