import type { NavigatorScreenParams } from '@react-navigation/native';

/** Params for a generic sub-form / child-form screen. */
export type FormRouteParams = {
  auditId: string;
  orderNumber: string;
  parentFormID: string;
  childFormID: string;
  formName: string;
  /** present only when opened as an added Child Form (vs. one of the 5 fixed sub-forms) */
  isChildForm?: boolean;
};

export type RootStackParamList = {
  CreateAudit: undefined;
  AuditForm: { auditId: string; orderNumber: string };
  AddChildForm: { auditId: string; orderNumber: string };

  GeneralInformationForm: FormRouteParams;
  OnArrivalForm: FormRouteParams;
  GenericPerformanceForm: FormRouteParams;
  SummaryForm: FormRouteParams;
  DontWalkByForm: FormRouteParams;

  Form101UgCablingForm: FormRouteParams;
  Form201CivilsForm: FormRouteParams;
  Form401ESideIpForm: FormRouteParams;
  Form403DSideIpForm: FormRouteParams;
  Form405ConstructionJointingForm: FormRouteParams;
  Form407PcpIpForm: FormRouteParams;
  Form409MdfIpForm: FormRouteParams;
  Form411PrecisionTestForm: FormRouteParams;
  Form417PcpCustomerProvisionForm: FormRouteParams;
  Form501OhRepairForm: FormRouteParams;
  Form503OhCablingForm: FormRouteParams;
  Form505PolingIpForm: FormRouteParams;
  Form524FndSpinQualityCheckForm: FormRouteParams;
  Form560FttpPlanningBuildUgIpRemedialForm: FormRouteParams;
  Form561FttpBOhRForm: FormRouteParams;
  Form570OfnFttpForm: FormRouteParams;
  Form578FttpConnectorizedL2cOhIpRemedialForm: FormRouteParams;
  Form579FttpConnectorizedL2cUgIpRemedialForm: FormRouteParams;
  Form589FbcOfnFttpQualityAuditCheckIpRemedialForm: FormRouteParams;
  Form590FbcOfnFttpQualityAuditCheckListIpRemedialForm: FormRouteParams;
};

export type RootParamList = NavigatorScreenParams<RootStackParamList>;
