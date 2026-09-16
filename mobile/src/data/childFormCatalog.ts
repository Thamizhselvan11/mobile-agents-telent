/**
 * AC26 — the 20 selectable child-form categories shown on AddChildFormScreen
 * (Figma 4:4 shows the first 10 rows; scroll reveals the rest). Screen name
 * maps to the navigator route registered for each child form.
 */
export interface ChildFormCatalogEntry {
  code: string; // e.g. "101"
  title: string; // e.g. "Form 101 - UG CABLING"
  screen: string; // navigator route name
}

export const CHILD_FORM_CATALOG: ChildFormCatalogEntry[] = [
  { code: '101', title: 'Form 101 - UG CABLING', screen: 'Form101UgCablingForm' },
  { code: '201', title: 'Form 201 - CIVILS', screen: 'Form201CivilsForm' },
  { code: '401', title: 'Form 401 - E SIDE IP', screen: 'Form401ESideIpForm' },
  { code: '403', title: 'Form 403 - D SIDE IP', screen: 'Form403DSideIpForm' },
  { code: '405', title: 'Form 405 - CONSTRUCTION JOINTING', screen: 'Form405ConstructionJointingForm' },
  { code: '407', title: 'Form 407 - PCP IP', screen: 'Form407PcpIpForm' },
  { code: '409', title: 'Form 409 - MDF IP', screen: 'Form409MdfIpForm' },
  { code: '411', title: 'Form 411 - PRECISION TEST', screen: 'Form411PrecisionTestForm' },
  { code: '417', title: 'Form 417 - PCP CUSTOMER PROVISION', screen: 'Form417PcpCustomerProvisionForm' },
  { code: '501', title: 'Form 501 - OH REPAIR', screen: 'Form501OhRepairForm' },
  { code: '503', title: 'Form 503 - OH CABLING', screen: 'Form503OhCablingForm' },
  { code: '505', title: 'Form 505 - POLING IP', screen: 'Form505PolingIpForm' },
  { code: '524', title: 'Form 524 - FND SPIN quality check', screen: 'Form524FndSpinQualityCheckForm' },
  {
    code: '560',
    title: 'Form 560 - FTTP Planning & build UG IP & Remedial',
    screen: 'Form560FttpPlanningBuildUgIpRemedialForm',
  },
  { code: '561', title: 'Form 561 - FTTP & B OH & R', screen: 'Form561FttpBOhRForm' },
  { code: '570', title: 'Form 570 - OFN FTTP', screen: 'Form570OfnFttpForm' },
  {
    code: '578',
    title: 'Form 578 - FTTP Connectorized L2C OH IP & Remedial',
    screen: 'Form578FttpConnectorizedL2cOhIpRemedialForm',
  },
  {
    code: '579',
    title: 'Form 579 - FTTP Connectorized L2C UG IP & Remedial',
    screen: 'Form579FttpConnectorizedL2cUgIpRemedialForm',
  },
  {
    code: '589',
    title: 'Form 589 - FBC - OFN FTTP quality audit check IP & Remedial',
    screen: 'Form589FbcOfnFttpQualityAuditCheckIpRemedialForm',
  },
  {
    code: '590',
    title: 'Form 590 - FBC - OFN FTTP quality audit check list IP & Remedial',
    screen: 'Form590FbcOfnFttpQualityAuditCheckListIpRemedialForm',
  },
];
