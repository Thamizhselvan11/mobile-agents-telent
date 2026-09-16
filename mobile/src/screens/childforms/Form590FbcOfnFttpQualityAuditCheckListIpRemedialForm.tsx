import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { GenericChecklistFormScreen } from '../../components/GenericChecklistFormScreen';
import { FORM_590_FBC_OFN_FTTP_QUALITY_AUDIT_CHECK_LIST_IP_REMEDIAL_FIELDS } from '../../data/childFormFields';

type Props = NativeStackScreenProps<RootStackParamList, 'Form590FbcOfnFttpQualityAuditCheckListIpRemedialForm'>;

/**
 * Form 590 - FBC - OFN FTTP quality audit check list IP & Remedial
 * Single-section child form (AC32). All fields use the shared
 * ChecklistItemWithPhoto Bottom-DialogBox pattern (AC22/AC28); the first
 * field is this form's one mandatory question (AC27).
 */
export default function Form590FbcOfnFttpQualityAuditCheckListIpRemedialForm({ route }: Props) {
  const { auditId, orderNumber, parentFormID, childFormID } = route.params;
  return (
    <GenericChecklistFormScreen
      config={{
        title: 'Form 590 - FBC - OFN FTTP quality audit check list IP & Remedial',
        sectionName: 'FBC - OFN FTTP QUALITY AUDIT CHECK LIST IP & REMEDIAL',
        fields: FORM_590_FBC_OFN_FTTP_QUALITY_AUDIT_CHECK_LIST_IP_REMEDIAL_FIELDS,
        mandatoryIndex: 0,
      }}
      routeParams={{ auditId, orderNumber, parentFormID, childFormID }}
    />
  );
}
