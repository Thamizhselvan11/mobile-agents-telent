/**
 * Form 201-CIVILS — 10 sub-titles (AC30, AC32). Only ONE sub-title needs to
 * be completed for the whole form to be Completed (AC27).
 */
export interface CivilsSubTitle {
  name: string;
  fields: string[];
}

export const FORM_201_CIVILS_SUBTITLES: CivilsSubTitle[] = [
  {
    name: 'Duct Laying',
    fields: [
      'Trench bottom compacted prior to laying duct',
      'Soft Bed provided in rocky soil',
      'Duct laid at specified/agreed depth within tolerance',
      'Duct laid to planned route or agreed alternative',
      'Singleway duct laid and jointed correctly',
      'Multiway ducts laid and jointed correctly up to and including 9 way',
      'Multiway ducts laid and jointed correctly over 9 way',
      'Fine fill cover/surround to duct hand compacted to a depth of 75mm',
      'Minimum clearances observed',
      'Duct formations have specified separation at chamber entries',
      'Duct Cleaning & Testing carried out as per Specification',
      'Draw rope provided and secured at each end, spliced correctly & free from knots and strands',
      'All slewing operations performed to specification',
      'Concrete protection provided as per works instructions',
      'Correct type of duct bends and duct tees used',
    ],
  },
  {
    name: 'Duct Seal/Lead In/Termination',
    fields: [
      'Duct entries to chambers/building walls/floors by appropriate approved method',
      'All necessary steps taken to minimize damage from dirt/dust/water whilst core drilling',
      'Duct Seals fitted correctly including Draw Rope',
      'Pressure test of adhesive jointed duct carried out',
      'Duct to property wall/pole finished correctly',
    ],
  },
  {
    name: 'Jointing Chambers',
    fields: [
      'Constructed in planned position or agreed alternative',
      'Chambers constructed within dimensional tolerance',
      'Base/Floor cast correctly including sump as specified',
      'Walls constructed correctly as specified',
      'Concrete mix complies with specification',
      'Shuttering used correctly and removed without damage',
      'Brickwork complies with specification',
      'Reinforcement fitted as specified',
      'Safety furniture fitted correctly (steps, rails etc.)',
      'Frame position correct within chamber',
      'Roof slab cast correctly as specified',
      'Chamber sealed correctly against water ingress',
      'Duct entries formed correctly',
      'Duct entries sealed correctly',
      'Cable support brackets fitted correctly',
      'Cable support brackets positioned correctly',
      'Curing time observed before backfilling',
      'Backfill material complies with specification',
      'Backfill compacted correctly',
      'Chamber internal finish complies with specification',
      'Chamber external finish complies with specification',
      'Access covers fit correctly',
      'Access covers are the correct load rating',
      'Duct entry in safe position',
    ],
  },
  {
    name: 'Frames And Covers',
    fields: [
      'Frame correctly fitted and covers level — complies with Specification (unmade F/W)',
      'Frame correctly fitted and covers level — complies with Specification (unsurfaced C/W)',
      'Resin Bedding/Mortar used as specified; concrete surround to frame provided as per Specification',
    ],
  },
  {
    name: 'Cabinets',
    fields: [
      'PCP/SCP Position and type of node as specified by work originator',
      'Cabinet upright, level and trowelled around flange as watershed',
      'Cabinet base correctly constructed including duct positioning',
      'PCP/SCP all base water sealing operations completed satisfactorily',
      'Earth connection point provided where applicable',
    ],
  },
  {
    name: 'Work on Stoppages',
    fields: ['Correct Kits and fittings used'],
  },
  {
    name: 'Materials',
    fields: [
      'All Materials on site are separated and protected from contamination & weather',
      'Cement used complies with specification',
      'Reinforcement Bars/mesh comply with specification',
      'Sand and aggregates comply with specification',
      'Any additives used have a certificate of approval issued by the TAA',
      'Concrete meets specification/slump/aggregate size/water purity',
      'Bricks used comply to BS3921',
      'Mortar used complies to BS 5628 parts 1 & 3',
      'Fine Fill material complies with specification',
      'Test cubes taken meet strength requirements',
    ],
  },
  {
    name: 'Reinstatement Work',
    fields: [
      'Road category correctly identified',
      'Reinstatement option correctly identified',
      'Backfill material complies with specification',
      'Backfill compaction complies with specification',
      'Wearing-course material complies with specification',
      'Wearing-course thickness complies with specification',
      'Base-course material complies with specification',
      'Base-course thickness complies with specification',
      'Sub-base material complies with specification',
      'Sub-base thickness complies with specification',
      'Reinstatement carried out within permitted time',
      'Reinstatement surface level and even',
      'Reinstatement joints sealed correctly',
      'Signage/guarding maintained during reinstatement',
      'Private-land owner satisfaction confirmed where applicable',
    ],
  },
  {
    name: 'Moleploughing',
    fields: [
      'Landowner notified prior to work commencement',
      'Duct/cable prepared and laid out in planned/agreed position',
      "Duct/cable 'ploughed in' at planned/agreed position",
      'Plant, equipment and practices meet BT requirements',
      "Duct/cable 'ploughed in' at specified/agreed depth",
      'Cable ends left safely and sealed with sufficient length for jointing',
    ],
  },
  {
    name: 'General',
    fields: [
      'Observed open Joints in worksite closed/reported',
      'Worksite left tidy — BT/Contractor rubbish removed',
      'Product Item not covered elsewhere in product checks',
    ],
  },
];
