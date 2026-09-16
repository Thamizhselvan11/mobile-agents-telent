import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';

import CreateAuditScreen from '../screens/CreateAuditScreen';
import AuditFormScreen from '../screens/AuditFormScreen';
import AddChildFormScreen from '../screens/AddChildFormScreen';

import GeneralInformationForm from '../screens/GeneralInformationForm';
import OnArrivalForm from '../screens/OnArrivalForm';
import GenericPerformanceForm from '../screens/GenericPerformanceForm';
import SummaryForm from '../screens/SummaryForm';
import DontWalkByForm from '../screens/DontWalkByForm';

import Form101UgCablingForm from '../screens/childforms/Form101UgCablingForm';
import Form201CivilsForm from '../screens/childforms/Form201CivilsForm';
import Form401ESideIpForm from '../screens/childforms/Form401ESideIpForm';
import Form403DSideIpForm from '../screens/childforms/Form403DSideIpForm';
import Form405ConstructionJointingForm from '../screens/childforms/Form405ConstructionJointingForm';
import Form407PcpIpForm from '../screens/childforms/Form407PcpIpForm';
import Form409MdfIpForm from '../screens/childforms/Form409MdfIpForm';
import Form411PrecisionTestForm from '../screens/childforms/Form411PrecisionTestForm';
import Form417PcpCustomerProvisionForm from '../screens/childforms/Form417PcpCustomerProvisionForm';
import Form501OhRepairForm from '../screens/childforms/Form501OhRepairForm';
import Form503OhCablingForm from '../screens/childforms/Form503OhCablingForm';
import Form505PolingIpForm from '../screens/childforms/Form505PolingIpForm';
import Form524FndSpinQualityCheckForm from '../screens/childforms/Form524FndSpinQualityCheckForm';
import Form560FttpPlanningBuildUgIpRemedialForm from '../screens/childforms/Form560FttpPlanningBuildUgIpRemedialForm';
import Form561FttpBOhRForm from '../screens/childforms/Form561FttpBOhRForm';
import Form570OfnFttpForm from '../screens/childforms/Form570OfnFttpForm';
import Form578FttpConnectorizedL2cOhIpRemedialForm from '../screens/childforms/Form578FttpConnectorizedL2cOhIpRemedialForm';
import Form579FttpConnectorizedL2cUgIpRemedialForm from '../screens/childforms/Form579FttpConnectorizedL2cUgIpRemedialForm';
import Form589FbcOfnFttpQualityAuditCheckIpRemedialForm from '../screens/childforms/Form589FbcOfnFttpQualityAuditCheckIpRemedialForm';
import Form590FbcOfnFttpQualityAuditCheckListIpRemedialForm from '../screens/childforms/Form590FbcOfnFttpQualityAuditCheckListIpRemedialForm';

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Full navigation flow (per 03-frontend-builder scope item 7):
 * CreateAudit -> AuditForm -> (tap sub-form) -> that screen -> back to
 * AuditForm with updated status; AuditForm's Add -> AddChildForm ->
 * (pick a child form) -> that screen -> back to AuditForm with the child
 * form added to the list.
 */
export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="CreateAudit"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="CreateAudit" component={CreateAuditScreen} />
        <Stack.Screen name="AuditForm" component={AuditFormScreen} />
        <Stack.Screen name="AddChildForm" component={AddChildFormScreen} />

        <Stack.Screen name="GeneralInformationForm" component={GeneralInformationForm} />
        <Stack.Screen name="OnArrivalForm" component={OnArrivalForm} />
        <Stack.Screen name="GenericPerformanceForm" component={GenericPerformanceForm} />
        <Stack.Screen name="SummaryForm" component={SummaryForm} />
        <Stack.Screen name="DontWalkByForm" component={DontWalkByForm} />

        <Stack.Screen name="Form101UgCablingForm" component={Form101UgCablingForm} />
        <Stack.Screen name="Form201CivilsForm" component={Form201CivilsForm} />
        <Stack.Screen name="Form401ESideIpForm" component={Form401ESideIpForm} />
        <Stack.Screen name="Form403DSideIpForm" component={Form403DSideIpForm} />
        <Stack.Screen name="Form405ConstructionJointingForm" component={Form405ConstructionJointingForm} />
        <Stack.Screen name="Form407PcpIpForm" component={Form407PcpIpForm} />
        <Stack.Screen name="Form409MdfIpForm" component={Form409MdfIpForm} />
        <Stack.Screen name="Form411PrecisionTestForm" component={Form411PrecisionTestForm} />
        <Stack.Screen name="Form417PcpCustomerProvisionForm" component={Form417PcpCustomerProvisionForm} />
        <Stack.Screen name="Form501OhRepairForm" component={Form501OhRepairForm} />
        <Stack.Screen name="Form503OhCablingForm" component={Form503OhCablingForm} />
        <Stack.Screen name="Form505PolingIpForm" component={Form505PolingIpForm} />
        <Stack.Screen name="Form524FndSpinQualityCheckForm" component={Form524FndSpinQualityCheckForm} />
        <Stack.Screen
          name="Form560FttpPlanningBuildUgIpRemedialForm"
          component={Form560FttpPlanningBuildUgIpRemedialForm}
        />
        <Stack.Screen name="Form561FttpBOhRForm" component={Form561FttpBOhRForm} />
        <Stack.Screen name="Form570OfnFttpForm" component={Form570OfnFttpForm} />
        <Stack.Screen
          name="Form578FttpConnectorizedL2cOhIpRemedialForm"
          component={Form578FttpConnectorizedL2cOhIpRemedialForm}
        />
        <Stack.Screen
          name="Form579FttpConnectorizedL2cUgIpRemedialForm"
          component={Form579FttpConnectorizedL2cUgIpRemedialForm}
        />
        <Stack.Screen
          name="Form589FbcOfnFttpQualityAuditCheckIpRemedialForm"
          component={Form589FbcOfnFttpQualityAuditCheckIpRemedialForm}
        />
        <Stack.Screen
          name="Form590FbcOfnFttpQualityAuditCheckListIpRemedialForm"
          component={Form590FbcOfnFttpQualityAuditCheckListIpRemedialForm}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
