/**
 * Service-layer tests for src/services/localStorage.ts + realmSchema.ts.
 *
 * jest.mock('realm', factory) re-exports the real Realm SDK but forces every
 * Realm.open() call into `inMemory: true` mode with a unique path per open —
 * so these tests exercise real Realm read/write/query/primary-key/schema
 * behavior without ever touching an on-device .realm file. See
 * ../../__test-utils__/realmInMemoryMockFactory.js for why this must be an
 * inline factory rather than a root __mocks__/realm.js file. closeRealm() is
 * called in afterEach so every test gets a fresh in-memory database
 * (getRealm() lazily reopens on next call).
 */
jest.mock('realm', () => require('../../__test-utils__/realmInMemoryMockFactory')());
// Realm's native binding does a one-time (slow, first-load) initialization
// under Jest's Node process; give it headroom above Jest's 5s default.
jest.setTimeout(30000);

import { closeRealm } from '../realmSchema';
import {
  saveAudit,
  getAudit,
  seedFormStatus,
  getFormStatus,
  getFormStatusesForAudit,
  saveFormStatus,
  saveFormAnswer,
  getFormAnswers,
  generateCqpNumber,
  generateId,
  getCurrentLocationStub,
} from '../localStorage';

afterEach(() => {
  closeRealm();
});

describe('generateId', () => {
  it('produces a string prefixed as requested', () => {
    const id = generateId('audit');
    expect(id.startsWith('audit_')).toBe(true);
  });

  it('produces unique ids across calls', () => {
    const ids = new Set(Array.from({ length: 20 }, () => generateId('x')));
    expect(ids.size).toBe(20);
  });
});

describe('generateCqpNumber', () => {
  it('matches the given example shape CQP/NA/YYYY-MM/DD HH:mm:ss', () => {
    const fixedDate = new Date(2023, 9, 3, 4, 0, 35); // month is 0-indexed: 9 = October
    const cqp = generateCqpNumber(fixedDate);
    expect(cqp).toBe('CQP/NA/2023-10/03 04:00:35');
  });

  it('pads single-digit month/day/hour/minute/second with a leading zero', () => {
    const fixedDate = new Date(2024, 0, 5, 3, 4, 5); // Jan 5th, 03:04:05
    const cqp = generateCqpNumber(fixedDate);
    expect(cqp).toBe('CQP/NA/2024-01/05 03:04:05');
  });

  it('defaults to the current date/time when no argument is given', () => {
    const before = Date.now();
    const cqp = generateCqpNumber();
    const after = Date.now();
    expect(cqp).toMatch(/^CQP\/NA\/\d{4}-\d{2}\/\d{2} \d{2}:\d{2}:\d{2}$/);
    // sanity: the year embedded matches "now" (before/after straddle the call)
    const yearInCqp = Number(cqp.slice(7, 11));
    expect(yearInCqp).toBe(new Date(before).getFullYear());
    expect(after - before).toBeLessThan(5000);
  });
});

describe('getCurrentLocationStub', () => {
  it('returns empty strings (native module not wired this pass)', async () => {
    const result = await getCurrentLocationStub();
    expect(result).toEqual({ latitude: '', longitude: '', location: '' });
  });
});

describe('saveAudit / getAudit', () => {
  it('round-trips an AuditRecord through Realm', async () => {
    const record = {
      id: generateId('audit'),
      auditType: 'Retrospective',
      primaryAuditType: 'Retrospective',
      orderNumber: '1234567890',
      cqpNumber: generateCqpNumber(),
      createdAt: new Date().toISOString(),
    };
    await saveAudit(record);
    const fetched = await getAudit(record.id);
    expect(fetched).toEqual(record);
  });

  it('returns undefined for an audit id that was never saved', async () => {
    const fetched = await getAudit('does-not-exist');
    expect(fetched).toBeUndefined();
  });

  it('updates an existing AuditRecord in place when saved again with the same id (UpdateMode.Modified)', async () => {
    const id = generateId('audit');
    await saveAudit({
      id,
      auditType: 'Agent Gate Check',
      primaryAuditType: 'Agent Gate Check',
      orderNumber: '1111111111',
      cqpNumber: 'CQP/NA/2023-10/01 00:00:00',
      createdAt: new Date(2023, 0, 1).toISOString(),
    });
    await saveAudit({
      id,
      auditType: 'Agent Gate Check',
      primaryAuditType: 'Agent Gate Check',
      orderNumber: '2222222222', // changed
      cqpNumber: 'CQP/NA/2023-10/01 00:00:00',
      createdAt: new Date(2023, 0, 1).toISOString(),
    });
    const fetched = await getAudit(id);
    expect(fetched?.orderNumber).toBe('2222222222');
  });
});

describe('seedFormStatus / getFormStatus', () => {
  it('creates a FormStatus row seeded as "Not Started" with formSynced always false', async () => {
    const created = await seedFormStatus({
      visitId: 'audit_1',
      scheduleId: 'audit_1',
      parentFormID: 'audit_1',
      childFormID: 'sf_1',
      orderNumber: '1234567890',
      formName: 'General Information',
      formType: 'sub-form',
      createdBy: 'local-user',
    });

    expect(created.status).toBe('Not Started');
    expect(created.formSynced).toBe(false);
    expect(created.formName).toBe('General Information');
    expect(created.reason).toBe('');
    expect(typeof created.createdAt).toBe('string');
    // ISO date string round trip
    expect(new Date(created.createdAt).toISOString()).toBe(created.createdAt);

    const fetched = await getFormStatus(created.id);
    expect(fetched).toEqual(created);
  });

  it('getFormStatus returns undefined for an unknown id', async () => {
    const fetched = await getFormStatus('nope');
    expect(fetched).toBeUndefined();
  });
});

describe('getFormStatusesForAudit', () => {
  it('returns only the FormStatus rows matching the given orderNumber', async () => {
    await seedFormStatus({
      visitId: 'audit_a',
      scheduleId: 'audit_a',
      parentFormID: 'audit_a',
      childFormID: 'sf_a1',
      orderNumber: '1111111111',
      formName: 'General Information',
      formType: 'sub-form',
      createdBy: 'local-user',
    });
    await seedFormStatus({
      visitId: 'audit_b',
      scheduleId: 'audit_b',
      parentFormID: 'audit_b',
      childFormID: 'sf_b1',
      orderNumber: '2222222222',
      formName: 'On Arrival',
      formType: 'sub-form',
      createdBy: 'local-user',
    });

    const forA = await getFormStatusesForAudit('1111111111');
    expect(forA).toHaveLength(1);
    expect(forA[0].formName).toBe('General Information');

    const forUnknown = await getFormStatusesForAudit('does-not-exist');
    expect(forUnknown).toEqual([]);
  });
});

describe('saveFormStatus', () => {
  it('updates status/reason/modifiedAt on an existing row', async () => {
    const created = await seedFormStatus({
      visitId: 'audit_1',
      scheduleId: 'audit_1',
      parentFormID: 'audit_1',
      childFormID: 'cf_1',
      orderNumber: '1234567890',
      formName: 'Form 101 - UG CABLING',
      formType: 'child-form',
      createdBy: 'local-user',
    });

    await saveFormStatus(created.id, 'In Progress', 'partial answers');

    const fetched = await getFormStatus(created.id);
    expect(fetched?.status).toBe('In Progress');
    expect(fetched?.reason).toBe('partial answers');
    expect(new Date(fetched!.modifiedAt).getTime()).toBeGreaterThanOrEqual(
      new Date(created.modifiedAt).getTime(),
    );
  });

  it('does nothing (no throw) when the id does not exist', async () => {
    await expect(saveFormStatus('nope', 'Completed')).resolves.toBeUndefined();
  });

  it('defaults reason to an empty string when omitted', async () => {
    const created = await seedFormStatus({
      visitId: 'audit_1',
      scheduleId: 'audit_1',
      parentFormID: 'audit_1',
      childFormID: 'cf_2',
      orderNumber: '1234567890',
      formName: 'Form 201 - CIVILS',
      formType: 'child-form',
      createdBy: 'local-user',
    });
    await saveFormStatus(created.id, 'Completed');
    const fetched = await getFormStatus(created.id);
    expect(fetched?.reason).toBe('');
  });
});

describe('saveFormAnswer / getFormAnswers', () => {
  it('creates a new FormAnswer row when none exists for the parent/child/cateCode triple', async () => {
    const answer = await saveFormAnswer({
      visitId: 'audit_1',
      scheduleId: 'audit_1',
      parentFormID: 'audit_1',
      childFormID: 'cf_1',
      orderNumber: '1234567890',
      formName: 'Form 101 - UG CABLING',
      cateCode: 'F0',
      answer: JSON.stringify({ option: 'Checked OK', beforePhotos: [], afterPhotos: [] }),
    });

    expect(answer.cateCode).toBe('F0');
    expect(answer.answer).toContain('Checked OK');

    const all = await getFormAnswers('audit_1', 'cf_1');
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe(answer.id);
  });

  it('updates the SAME row (not a new one) when saved again with the same parent/child/cateCode triple', async () => {
    const first = await saveFormAnswer({
      visitId: 'audit_1',
      scheduleId: 'audit_1',
      parentFormID: 'audit_1',
      childFormID: 'cf_9',
      orderNumber: '1234567890',
      formName: 'Form 589 - FBC - OFN FTTP quality audit check IP & Remedial',
      cateCode: 'F0',
      answer: JSON.stringify({ option: 'Checked OK', beforePhotos: [], afterPhotos: [] }),
    });

    const second = await saveFormAnswer({
      visitId: 'audit_1',
      scheduleId: 'audit_1',
      parentFormID: 'audit_1',
      childFormID: 'cf_9',
      orderNumber: '1234567890',
      formName: 'Form 589 - FBC - OFN FTTP quality audit check IP & Remedial',
      cateCode: 'F0',
      answer: JSON.stringify({ option: 'Below Standard', beforePhotos: [], afterPhotos: [] }),
    });

    expect(second.id).toBe(first.id); // same row, updated in place
    expect(second.answer).toContain('Below Standard');

    const all = await getFormAnswers('audit_1', 'cf_9');
    expect(all).toHaveLength(1);
    expect(all[0].answer).toContain('Below Standard');
  });

  it('keeps answers for different cateCodes as separate rows under the same parent/child', async () => {
    await saveFormAnswer({
      visitId: 'audit_1',
      scheduleId: 'audit_1',
      parentFormID: 'audit_1',
      childFormID: 'cf_multi',
      orderNumber: '1234567890',
      formName: 'Form 560 - FTTP Planning & build UG IP & Remedial',
      cateCode: 'F0',
      answer: 'answer-0',
    });
    await saveFormAnswer({
      visitId: 'audit_1',
      scheduleId: 'audit_1',
      parentFormID: 'audit_1',
      childFormID: 'cf_multi',
      orderNumber: '1234567890',
      formName: 'Form 560 - FTTP Planning & build UG IP & Remedial',
      cateCode: 'F1',
      answer: 'answer-1',
    });

    const all = await getFormAnswers('audit_1', 'cf_multi');
    expect(all).toHaveLength(2);
    expect(all.map(a => a.cateCode).sort()).toEqual(['F0', 'F1']);
  });

  it('getFormAnswers returns an empty array when nothing matches', async () => {
    const all = await getFormAnswers('unknown_parent', 'unknown_child');
    expect(all).toEqual([]);
  });
});
