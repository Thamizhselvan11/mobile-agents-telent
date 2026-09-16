module.exports = {
  preset: '@react-native/jest-preset',
  moduleNameMapper: {
    // The RN jest preset's test environment sets
    // customExportConditions = ['require', 'react-native'], which makes ANY
    // package's `exports` field resolve its "react-native" condition first —
    // including `realm` and its `@realm/fetch` dependency, whose
    // react-native builds are Metro-only ESM that Jest's Babel transform
    // (which ignores node_modules by default) cannot parse. Force both to
    // their plain Node builds so src/services/__tests__/localStorage.test.ts
    // can load the real Realm SDK (used in-memory — see __mocks__/realm.js).
    '^realm$': '<rootDir>/node_modules/realm/dist/platform/node/index.js',
    '^@realm/fetch$': '<rootDir>/node_modules/@realm/fetch/dist/node-cjs/node.js',
  },
  // Pre-existing gap found by 10-unit-test-writer: the RN preset's default
  // transformIgnorePatterns only lets Babel transform react-native/
  // @react-native(-community) packages. @react-navigation/native (and its
  // sibling packages) ship ESM-only output with no CJS build
  // (package.json has no "main"/"require" condition, only "default"
  // pointing at lib/module), so Jest's untransformed `export` syntax broke
  // BEFORE this agent's changes too — reproduced against the original
  // jest.config.js (git stash) to confirm this is not something introduced
  // by this run. Extending the allowlist (rather than replacing it) fixes
  // the pre-existing __tests__/App.test.tsx failure.
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-navigation|react-native-screens|react-native-safe-area-context)/)',
  ],
};
