import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { GenericChecklistFormScreen } from '../../components/GenericChecklistFormScreen';
import { FORM_560_FTTP_PLANNING_BUILD_UG_IP_REMEDIAL_FIELDS } from '../../data/childFormFields';

type Props = NativeStackScreenProps<RootStackParamList, 'Form560FttpPlanningBuildUgIpRemedialForm'>;

/**
 * Form 560 - FTTP Planning & build UG IP & Remedial
 * Single-section child form (AC32). All fields use the shared
 * ChecklistItemWithPhoto Bottom-DialogBox pattern (AC22/AC28); the first
 * field is this form's one mandatory question (AC27).
 */
export default function Form560FttpPlanningBuildUgIpRemedialForm({ route }: Props) {
  const { auditId, orderNumber, parentFormID, childFormID } = route.params;
  return (
    <GenericChecklistFormScreen
      config={{
        title: 'Form 560 - FTTP Planning & build UG IP & Remedial',
        sectionName: 'FTTP PLANNING & BUILD UG IP & REMEDIAL',
        fields: FORM_560_FTTP_PLANNING_BUILD_UG_IP_REMEDIAL_FIELDS,
        mandatoryIndex: 0,
      }}
      routeParams={{ auditId, orderNumber, parentFormID, childFormID }}
    />
  );
}
