/* eslint-env jest */
/**
 * Shared factory for `jest.mock('realm', require('.../realmInMemoryMockFactory'))`.
 *
 * Must be used as an INLINE jest.mock factory (not a root __mocks__/realm.js
 * file) — Jest auto-mocks function/class statics found on manual mocks for
 * node_modules packages, which silently replaced `Realm.open` with a
 * `jest.fn()` returning undefined during this agent's investigation. An
 * inline jest.mock(...) factory is used as-is, with no such auto-mocking.
 *
 * Re-exports the REAL Realm SDK (see jest.config.js's moduleNameMapper,
 * which routes 'realm'/'@realm/fetch' to their plain Node builds — the RN
 * jest environment's customExportConditions would otherwise resolve their
 * Metro-only "react-native" builds, which Jest's default transform can't
 * parse) and overrides only `Realm.open` so every call is forced into
 * `inMemory: true` with a fresh, unique path — so tests exercise real Realm
 * read/write/query/schema/primary-key behavior without ever touching an
 * on-device .realm file.
 *
 * Usage in a test file (must be called before any import of code that
 * imports 'realm', per normal jest.mock hoisting rules):
 *   jest.mock('realm', () => require('../../__test-utils__/realmInMemoryMockFactory')());
 */
module.exports = function realmInMemoryMockFactory() {
  const RealActualRealm = jest.requireActual('realm').Realm;
  let counter = 0;

  class RealmInMemory extends RealActualRealm {
    static open(config) {
      counter += 1;
      return RealActualRealm.open({
        ...config,
        inMemory: true,
        path: `jest-inmemory-${process.pid}-${Date.now()}-${counter}.realm`,
      });
    }
  }

  // Carry over every other static member (Object, BSON, UpdateMode, etc.)
  for (const key of Object.getOwnPropertyNames(RealActualRealm)) {
    if (key === 'length' || key === 'name' || key === 'prototype' || key === 'open') continue;
    const descriptor = Object.getOwnPropertyDescriptor(RealActualRealm, key);
    if (descriptor) Object.defineProperty(RealmInMemory, key, descriptor);
  }

  return { __esModule: true, default: RealmInMemory, Realm: RealmInMemory };
};
