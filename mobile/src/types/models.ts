/**
 * Local data models — mirrors the Given Schema in .mstack/acs.md verbatim
 * (FormStatus, FormAnswer, ImageModel). destination: local for all three
 * (Realm-style, on-device only — backend-needed: false).
 *
 * NOTE: 06-local-storage-agent owns the actual Realm schema/DB wiring.
 * These are the TypeScript shapes the UI layer and localStorage.ts service
 * are written against.
 */

export type FormStatusValue = 'Not Started' | 'In Progress' | 'Completed';

export interface FormStatus {
  id: string; // Primary Key
  visitId: string;
  scheduleId: string;
  parentFormID: string;
  childFormID: string;
  orderNumber: string;
  formName: string;
  formType: string;
  createdBy: string;
  createdAt: string; // ISO date
  modifiedAt: string; // ISO date
  status: FormStatusValue;
  formSynced: boolean; // TODO: inert this pass — no backend exists (backend-needed: false); see AC's Sync Behavior note
  reason: string;
}

export interface FormAnswer {
  id: string; // Primary Key
  visitId: string;
  scheduleId: string;
  parentFormID: string;
  childFormID: string;
  orderNumber: string;
  formName: string;
  cateCode: string; // Category code
  answer: string; // Answer value (image answers store ImageModel[] as JSON)
  createdAt: string;
  modifiedAt: string;
}

export interface ImageModel {
  latitude: string;
  longitude: string;
  location: string;
  photoTakenBy: string;
  photoTakenAt: string;
  values: string; // Image URL
  localPath: string; // Local image save path
}

/** Bottom DialogBox pattern answer (AC22/AC28) shared by Generic Performance + all 22 child forms. */
export type ChecklistOption = 'Checked OK' | 'Below Standard' | 'Fixed at Audit';

export interface ChecklistAnswer {
  option: ChecklistOption | null;
  beforePhotos: ImageModel[];
  afterPhotos: ImageModel[];
}

export interface AuditRecord {
  id: string;
  auditType: string;
  primaryAuditType: string;
  orderNumber: string;
  cqpNumber: string;
  createdAt: string;
}
