/**
 * AC3 — Audit Type / Primary Audit Type dropdown values are category-based;
 * the set of forms loaded depends on which Audit Type is chosen.
 */
export interface AuditTypeOption {
  label: string;
  formSet: string[]; // sub-form names seeded for this category
}

export const AUDIT_TYPE_OPTIONS: AuditTypeOption[] = [
  { label: 'Agent Gate Check', formSet: ['Form 701-Civil', 'Form 711-Cable', 'Form 731-Asset'] },
  { label: 'In Progress', formSet: ['Form 701-Civil', 'Form 711-Cable', 'Form 731-Asset'] },
  { label: 'Retrospective', formSet: ['Form 700-Job Validation'] },
];

/**
 * Primary Audit Type is a NESTED list, filtered by whichever Audit Type
 * category was already chosen — never the flat Audit Type list itself.
 * Returns [] until an Audit Type is selected, or if it somehow doesn't
 * match any known category (defensive default, not expected in practice).
 */
export function getPrimaryAuditTypeOptions(auditType: string | null): string[] {
  if (!auditType) return [];
  const match = AUDIT_TYPE_OPTIONS.find(o => o.label === auditType);
  return match ? match.formSet : [];
}

export const FIXED_SUB_FORMS = [
  'General Information',
  'On Arrival',
  'Generic Performance',
  'Summary',
  "Don't Walk By",
] as const;
