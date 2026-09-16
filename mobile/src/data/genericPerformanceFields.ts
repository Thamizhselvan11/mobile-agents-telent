/**
 * Generic Performance sub-form — 10 internal sub-sections (AC20, AC23).
 * Work Information is handled separately by the shared WorkInformation
 * component; the other 9 use the shared ChecklistItemWithPhoto pattern.
 */
export interface PerformanceSubSection {
  name: string;
  fields: string[];
}

export const GENERIC_PERFORMANCE_SUBSECTIONS: PerformanceSubSection[] = [
  {
    name: 'General',
    fields: [
      'Operatives on site as per Gang Location Sheets?',
      'Performance Item not covered elsewhere within Performance Checksheets as a 10 point item that meets agreed CD criteria',
      'At least one operative on site conversant with English language',
    ],
  },
  {
    name: 'Roadworks Guarding',
    fields: [
      'Contractors Information Board displayed on site?',
      'Correct size signs / barriers / cones for the speed of road and all plant and equipment placed within the barriers?',
      'Sandbags used when weighting is necessary?',
      'Are the safety zones and controls in place sufficient to prevent injury to operatives and members of the public from any activities being carried out?',
      'Lead in / exit taper in place with correct number of cones and angle of taper',
      'Minimum widths of carriageway maintained for mode of traffic control employed?',
      'Pedestrian Walkway meets / exceeds COP minimum width requirements',
      'Handrail and tapping rail in place, is the correct height above the ground and meets the COP depth requirements',
      'Kerb ramps / footway boards / road plates used when necessary',
      'Are traffic lights installed and set correctly?',
      'Is alternative means of traffic control available (that meets the requirements of the COP) on site in the event of primary traffic control failure?',
      'Cable installed in a protector?',
      'Use of flashing lamps meets COP requirements?',
      'Signs illuminated when required as per the Code of Practice?',
      'Where required, are suitable physical pedestrian barriers in place around excavations?',
      'Traffic control option meets criteria within the Code of Practice?',
      'Code of Practice "Safety at Street Works and Road Works" available on site?',
      'Contractor has approval for multi-headed traffic lights?',
      'Contractor has notified Highway Authority of the use of 2 way traffic lights?',
      'Are all vehicles positioned safely as per the Code of Practice',
      'Where COP cannot be applied, has an alternative means of protecting pedestrians been recorded on the Site Risk Assessment?',
      'Are vehicles and required plant fitted with fully functional Amber Flashing Beacons?',
    ],
  },
  {
    name: 'Safety',
    fields: [
      'Safety Harness meet required standard and are worn by operative where necessary?',
      'Do the gang have continual gas monitoring and testing equipment on site where required?',
      'Is there at least one operative on site trained and able to demonstrate competent use of Gas Monitor / Detector where access to the U/G network is required.',
      'Has a gas test been carried out and have the results been recorded?',
      'Is calibrated or in date inspection operational Cable Avoidance Equipment available on site were excavation is required?',
      'Where excavation is required is there at least one operative on site trained and able to demonstrate competent use the Cable Avoidance Equipment.',
      'Evidence of tests for underground apparatus location carried out on site correctly and marked out accordingly?',
      'Health & Safety File available on site?',
      'Are Gas Bottles / Compressed Air Cylinders being used / stored correctly?',
      'Are effective site communications in place?',
      'Site Specific Risks Assessment valid and completed for the Site Conditions / Operation / Period?',
      'Where required is Personnel Protection Equipment on site as per confined spaces regulations (ie blowers / rescue equipment.)',
      "Confined Space compliance (Qualifications & equipment) — where required are all persons sufficiently trained in accordance with BT's confined space arrangements",
      'Mechanical lifters used when handling CW covers where possible',
      'Is Hi-Visibility clothing reasonably clean, in good condition and correct for the speed of road?',
      'Where there is a risk of head injury is correct head protection worn?',
      'Where there is a risk of eye injury is eye and face protection worn at all times?',
      'Where noise is a risk, is ear protection worn?',
      'Where dust / fume is a risk, is suitable respiratory protection worn?',
      'Is correct foot protection worn at all times whilst on site?',
      'Where there is a risk of hand injury is hand protection worn at all times?',
    ],
  },
  {
    name: 'Excavations',
    fields: [
      'Method / Machinery suitable for the Site / Job?',
      'Excavations in the vicinity of trees carried out in line with correct specifications?',
      'Excavation shored to prevent loss of ground?',
      'Existing Ducts / Mains supported correctly?',
      'Width of trench applicable to the work being undertaken?',
      'Excavated Material stored a safe distance away from the excavation?',
      'Excavations carried out so as not to undermine existing structures?',
      'Suitable safe access and egress provided?',
      'Trial (Pilot) holes undertaken onto expected or anticipated services.',
      'Deep excavations are inspected by a competent person before work commences.',
      'Demolition / dismantle of a structure / chamber is planned and executed safely.',
      'The arrangements for executing the demolition / dismantling are recorded in writing before the work begins.',
    ],
  },
  {
    name: 'Plant & Equipment',
    fields: [
      'Is the Plant and Equipment (including safety guards) in good condition and suitable for the work?',
      'Are Operatives competent to operate the plant and equipment on site in line with their appointed role?',
      'Have the daily, weekly and monthly checks been logged in the On site / Inspection Register and has it been kept up to date?',
      'Dust suppression equipment being used?',
      'Where trailers and towed plant are used, are they in good condition with an adequate means of securing the load during transport?',
    ],
  },
  {
    name: 'Hygiene/Welfare',
    fields: [
      'Do the Gang have First Aid supplies on site as required?',
      'Are Washing Facilities available on site?',
      'Are Toilet Facilities / details of the nearest Toilet Facilities on site?',
      'Is there an adequate supply of drinking water on site.',
    ],
  },
  {
    name: 'Environmental',
    fields: [
      'Are Resins and other Compounds securely stored and separated from inert material prior to disposal?',
      'Water from Chamber / Excavations disposed of Properly?',
      'Is there a risk of contamination from the storage of concrete products / spoil / run off liquids entering adjacent drains / gullies?',
      'Water testing kit on site.',
      'Can operatives demonstrate that water samples have been taken and checked for contamination.',
      'Care taken to prevent Damage / Contamination to Paving / Tarmac / Grass etc from Fuel, Oil etc?',
    ],
  },
  {
    name: 'Stop Work Notice',
    fields: [
      'Stop Work Notice issued for breach of Safety Requirements?',
      'Stop Work Notice issued for breach of Contractual Requirements?',
    ],
  },
  {
    name: 'Site and Other Documentation',
    fields: [
      'Site Register available and used on site?',
      'Code of Practice "Specifications for Reinstatement of Openings in the Highway" available on site?',
      'Access to current issue of relevant Specification available',
      'Copy of valid CN Drawings for each / any chamber being constructed available on site?',
      'Work Pack containing all necessary Prints and schematic Drawings available on site?',
      'Contractor has required NRSWA Notice?',
      'Contractor has the approved Road Closure Scheme?',
      'Site Personnel have correct NRSWA Accreditation/Registration for the work being executed where required?',
      'Operatives working in accordance with training, accreditation and licensing rules.',
      'Customer Information Cards / Letters delivered to affected properties?',
      'ID Cards carried by Contractors operatives.',
    ],
  },
];
