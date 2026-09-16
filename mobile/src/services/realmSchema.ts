/**
 * Realm schema definitions + Realm instance lifecycle.
 *
 * Written by 06-local-storage-agent. Owns:
 *  - the 3 given-schema local tables (FormStatus, FormAnswer, ImageModel —
 *    all `destination: local` per .mstack/acs.md's "## Given Schema"
 *    section, "Local Storage DB [Realm] Table Structure"). Field names/types
 *    are FIXED and transcribed verbatim — never renamed/restructured here.
 *  - the single shared Realm instance's open/close lifecycle.
 *
 * No sensitive data (tokens/passwords/credentials) exists anywhere in this
 * schema, so nothing here needs react-native-keychain — Realm-at-rest is an
 * acceptable mechanism for this plain structured data per
 * .claude/agents/06-local-storage-agent.md STEP 2.
 *
 * No sync/network logic lives here — backend-needed: false, and acs.md's
 * "## Sync Behavior" section confirms no submit-time or background sync
 * pattern applies this pass. FormStatus.formSynced is modeled verbatim but
 * stays inert/always-false (see FormStatusSchema below).
 *
 * Screens/services never import Realm directly — only src/services/
 * localStorage.ts (the wrapper) touches this file's exports.
 */

import Realm from 'realm';

/** FormStatus — destination: local (acs.md Given Schema, 14 fields). */
export class FormStatusSchema extends Realm.Object<FormStatusSchema> {
  id!: string; // Primary Key
  visitId!: string;
  scheduleId!: string;
  parentFormID!: string;
  childFormID!: string;
  orderNumber!: string;
  formName!: string;
  formType!: string;
  createdBy!: string;
  createdAt!: Date;
  modifiedAt!: Date;
  status!: string;
  formSynced!: boolean; // inert this pass — no backend exists (backend-needed: false)
  reason!: string;

  static schema: Realm.ObjectSchema = {
    name: 'FormStatus',
    primaryKey: 'id',
    properties: {
      id: 'string',
      visitId: 'string',
      scheduleId: 'string',
      parentFormID: 'string',
      childFormID: 'string',
      orderNumber: 'string',
      formName: 'string',
      formType: 'string',
      createdBy: 'string',
      createdAt: 'date',
      modifiedAt: 'date',
      status: 'string',
      formSynced: 'bool',
      reason: 'string',
    },
  };
}

/** FormAnswer — destination: local (acs.md Given Schema, 11 fields). */
export class FormAnswerSchema extends Realm.Object<FormAnswerSchema> {
  id!: string; // Primary Key
  visitId!: string;
  scheduleId!: string;
  parentFormID!: string;
  childFormID!: string;
  orderNumber!: string;
  formName!: string;
  cateCode!: string;
  answer!: string;
  createdAt!: Date;
  modifiedAt!: Date;

  static schema: Realm.ObjectSchema = {
    name: 'FormAnswer',
    primaryKey: 'id',
    properties: {
      id: 'string',
      visitId: 'string',
      scheduleId: 'string',
      parentFormID: 'string',
      childFormID: 'string',
      orderNumber: 'string',
      formName: 'string',
      cateCode: 'string',
      answer: 'string',
      createdAt: 'date',
      modifiedAt: 'date',
    },
  };
}

/**
 * ImageModel — destination: local (acs.md Given Schema, 7 fields).
 * Embedded (not top-level, no primary key given in the schema) — it is
 * stored as serialized JSON inside FormAnswer.answer / ChecklistAnswer per
 * AC34, so it is modeled here as a Realm embedded object for any future
 * direct-Realm use, while today's screens persist it via JSON.stringify
 * through FormAnswer, matching what 03-frontend-builder already wired.
 */
export class ImageModelSchema extends Realm.Object<ImageModelSchema> {
  latitude!: string;
  longitude!: string;
  location!: string;
  photoTakenBy!: string;
  photoTakenAt!: string;
  values!: string; // Image URL
  localPath!: string; // Local image save path

  static schema: Realm.ObjectSchema = {
    name: 'ImageModel',
    embedded: true,
    properties: {
      latitude: 'string',
      longitude: 'string',
      location: 'string',
      photoTakenBy: 'string',
      photoTakenAt: 'string',
      values: 'string',
      localPath: 'string',
    },
  };
}

/**
 * AuditRecord — a small local-only convenience table (NOT part of the given
 * schema) holding the audit header (auditType/primaryAuditType/orderNumber/
 * cqpNumber) that CreateAuditScreen/AuditFormScreen already read/write via
 * saveAudit/getAudit. Kept as its own Realm object so those existing wrapper
 * functions stay real (not in-memory) without inventing fields on the given
 * FormStatus/FormAnswer/ImageModel tables to hold it instead.
 */
export class AuditRecordSchema extends Realm.Object<AuditRecordSchema> {
  id!: string;
  auditType!: string;
  primaryAuditType!: string;
  orderNumber!: string;
  cqpNumber!: string;
  createdAt!: Date;

  static schema: Realm.ObjectSchema = {
    name: 'AuditRecord',
    primaryKey: 'id',
    properties: {
      id: 'string',
      auditType: 'string',
      primaryAuditType: 'string',
      orderNumber: 'string',
      cqpNumber: 'string',
      createdAt: 'date',
    },
  };
}

const REALM_SCHEMA_VERSION = 1;

let realmInstance: Realm | null = null;

/**
 * Opens (or returns the already-open) shared Realm instance. Realm's JS SDK
 * is synchronous to open, but this is exposed as async so callers/wrapper
 * functions can await it uniformly and so a future migration to an async-only
 * Realm API (or a different backing store) would not require call-site churn.
 */
export async function getRealm(): Promise<Realm> {
  if (realmInstance && !realmInstance.isClosed) {
    return realmInstance;
  }
  realmInstance = await Realm.open({
    schema: [FormStatusSchema, FormAnswerSchema, ImageModelSchema, AuditRecordSchema],
    schemaVersion: REALM_SCHEMA_VERSION,
  });
  return realmInstance;
}

/** Closes the shared Realm instance, if open. Mainly for tests/hot-reload cleanup. */
export function closeRealm(): void {
  if (realmInstance && !realmInstance.isClosed) {
    realmInstance.close();
  }
  realmInstance = null;
}
