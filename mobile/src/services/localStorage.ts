/**
 * Local storage service — Realm-backed persistence.
 *
 * Implemented by 06-local-storage-agent. All 30 screens (3 core + 5
 * sub-forms + 20 child forms) call ONLY the functions exported from this
 * file — never `realm.objects(...)` directly — so the underlying mechanism
 * can change later without touching a screen. Every exported function
 * signature below is unchanged from 03-frontend-builder's stub; only the
 * internals now read/write a real on-device Realm database (see
 * ./realmSchema.ts for the schema classes + Realm instance lifecycle).
 *
 * Given-schema tables claimed (all destination: local, per .mstack/acs.md):
 *  - FormStatus (14 fields)
 *  - FormAnswer (11 fields)
 *  - ImageModel (7 fields, embedded — persisted as JSON inside
 *    FormAnswer.answer / ChecklistAnswer, per AC34 and 03-frontend-builder's
 *    existing screens)
 *
 * backend-needed: false — nothing in this file ever calls the network.
 * No sync behavior is implemented (acs.md's "## Sync Behavior" section:
 * not applicable, no server exists this pass). FormStatus.formSynced is
 * modeled verbatim in realmSchema.ts but is always written `false` here and
 * never read/acted upon — inert, matching 03-frontend-builder's stub.
 *
 * No sensitive data (tokens/passwords/credentials) exists in this schema,
 * so react-native-keychain is not used here — Realm's on-device file
 * storage is an acceptable, appropriate mechanism for this plain
 * structured/offline dataset per 06-local-storage-agent's STEP 2.
 */

import Realm from 'realm';
import type { FormAnswer, FormStatus, FormStatusValue, AuditRecord } from '../types/models';
import {
  getRealm,
  FormStatusSchema,
  FormAnswerSchema,
  AuditRecordSchema,
} from './realmSchema';

function genId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
}

/** Converts a Realm FormStatus object to the plain FormStatus shape screens expect. */
function toFormStatus(o: FormStatusSchema): FormStatus {
  return {
    id: o.id,
    visitId: o.visitId,
    scheduleId: o.scheduleId,
    parentFormID: o.parentFormID,
    childFormID: o.childFormID,
    orderNumber: o.orderNumber,
    formName: o.formName,
    formType: o.formType,
    createdBy: o.createdBy,
    createdAt: o.createdAt.toISOString(),
    modifiedAt: o.modifiedAt.toISOString(),
    status: o.status as FormStatusValue,
    formSynced: o.formSynced,
    reason: o.reason,
  };
}

/** Converts a Realm FormAnswer object to the plain FormAnswer shape screens expect. */
function toFormAnswer(o: FormAnswerSchema): FormAnswer {
  return {
    id: o.id,
    visitId: o.visitId,
    scheduleId: o.scheduleId,
    parentFormID: o.parentFormID,
    childFormID: o.childFormID,
    orderNumber: o.orderNumber,
    formName: o.formName,
    cateCode: o.cateCode,
    answer: o.answer,
    createdAt: o.createdAt.toISOString(),
    modifiedAt: o.modifiedAt.toISOString(),
  };
}

// ---- Audit records (local convenience table, not part of the given schema) ----

export async function saveAudit(audit: AuditRecord): Promise<void> {
  const realm = await getRealm();
  realm.write(() => {
    realm.create(
      AuditRecordSchema,
      {
        id: audit.id,
        auditType: audit.auditType,
        primaryAuditType: audit.primaryAuditType,
        orderNumber: audit.orderNumber,
        cqpNumber: audit.cqpNumber,
        createdAt: new Date(audit.createdAt),
      },
      Realm.UpdateMode.Modified,
    );
  });
}

export async function getAudit(auditId: string): Promise<AuditRecord | undefined> {
  const realm = await getRealm();
  const o = realm.objectForPrimaryKey(AuditRecordSchema, auditId);
  if (!o) return undefined;
  return {
    id: o.id,
    auditType: o.auditType,
    primaryAuditType: o.primaryAuditType,
    orderNumber: o.orderNumber,
    cqpNumber: o.cqpNumber,
    createdAt: o.createdAt.toISOString(),
  };
}

// ---- FormStatus ----

export async function seedFormStatus(params: {
  visitId: string;
  scheduleId: string;
  parentFormID: string;
  childFormID: string;
  orderNumber: string;
  formName: string;
  formType: string;
  createdBy: string;
}): Promise<FormStatus> {
  const realm = await getRealm();
  const id = genId('fs');
  const now = new Date();
  let created!: FormStatusSchema;
  realm.write(() => {
    created = realm.create(FormStatusSchema, {
      id,
      visitId: params.visitId,
      scheduleId: params.scheduleId,
      parentFormID: params.parentFormID,
      childFormID: params.childFormID,
      orderNumber: params.orderNumber,
      formName: params.formName,
      formType: params.formType,
      createdBy: params.createdBy,
      createdAt: now,
      modifiedAt: now,
      status: 'Not Started',
      formSynced: false, // inert — no backend this pass (backend-needed: false)
      reason: '',
    });
  });
  return toFormStatus(created);
}

export async function getFormStatus(id: string): Promise<FormStatus | undefined> {
  const realm = await getRealm();
  const o = realm.objectForPrimaryKey(FormStatusSchema, id);
  return o ? toFormStatus(o) : undefined;
}

export async function getFormStatusesForAudit(orderNumber: string): Promise<FormStatus[]> {
  const realm = await getRealm();
  const results = realm
    .objects(FormStatusSchema)
    .filtered('orderNumber == $0', orderNumber);
  return Array.from(results).map(toFormStatus);
}

export async function saveFormStatus(
  id: string,
  status: FormStatusValue,
  reason: string = '',
): Promise<void> {
  const realm = await getRealm();
  realm.write(() => {
    const existing = realm.objectForPrimaryKey(FormStatusSchema, id);
    if (existing) {
      existing.status = status;
      existing.reason = reason;
      existing.modifiedAt = new Date();
    }
  });
}

// ---- FormAnswer ----

export async function saveFormAnswer(params: {
  visitId: string;
  scheduleId: string;
  parentFormID: string;
  childFormID: string;
  orderNumber: string;
  formName: string;
  cateCode: string;
  answer: string;
}): Promise<FormAnswer> {
  const realm = await getRealm();
  const existing = realm
    .objects(FormAnswerSchema)
    .filtered(
      'parentFormID == $0 && childFormID == $1 && cateCode == $2',
      params.parentFormID,
      params.childFormID,
      params.cateCode,
    )[0];

  let result!: FormAnswerSchema;
  realm.write(() => {
    if (existing) {
      existing.answer = params.answer;
      existing.modifiedAt = new Date();
      result = existing;
    } else {
      const now = new Date();
      result = realm.create(FormAnswerSchema, {
        id: genId('fa'),
        visitId: params.visitId,
        scheduleId: params.scheduleId,
        parentFormID: params.parentFormID,
        childFormID: params.childFormID,
        orderNumber: params.orderNumber,
        formName: params.formName,
        cateCode: params.cateCode,
        answer: params.answer,
        createdAt: now,
        modifiedAt: now,
      });
    }
  });
  return toFormAnswer(result);
}

export async function getFormAnswers(
  parentFormID: string,
  childFormID: string,
): Promise<FormAnswer[]> {
  const realm = await getRealm();
  const results = realm
    .objects(FormAnswerSchema)
    .filtered('parentFormID == $0 && childFormID == $1', parentFormID, childFormID);
  return Array.from(results).map(toFormAnswer);
}

// ---- GPS stub (AC17 Location, AC25 Location) ----
// NOT this agent's job — native-module/API stub, left exactly as
// 03-frontend-builder wrote it (see hand-off doc: "getCurrentLocationStub()
// ... are NOT your job — those are native-module/API stubs").

export async function getCurrentLocationStub(): Promise<{
  latitude: string;
  longitude: string;
  location: string;
}> {
  // TODO: needs native module — real device GPS wiring deferred this pass
  // (Stubs/Deferred: "Device GPS/current-location auto-population").
  return { latitude: '', longitude: '', location: '' };
}

// ---- CQP number generator (AC5) ----

export function generateCqpNumber(date: Date = new Date()): string {
  // Deterministic generator matching the one given literal example's shape
  // (`CQP/NA/2023-10/03 04:00:35`): prefix "CQP/NA/", then year-month, then
  // a day/time-derived suffix. No further algorithm was specified in the
  // source docs, so this keeps 03-frontend-builder's best-effort shape.
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return `CQP/NA/${year}-${month}/${day} ${hh}:${mm}:${ss}`;
}

export function generateId(prefix: string): string {
  return genId(prefix);
}
