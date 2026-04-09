// .eslintrc.js — Phase 3: ESLint config for Jiff
// Extends CRA's built-in config and adds project-specific rules.
module.exports = {
  extends: ['react-app', 'react-app/jest'],
  rules: {
    // Enforce no direct fetch() in components/pages (use services)
    // 'no-restricted-syntax': warn only — hard errors would block build
    'no-console': ['warn', { allow: ['error', 'warn'] }],

    // Prevent unused variables (catch dead code)
    'no-unused-vars': ['warn', {
      vars: 'all',
      args: 'after-used',
      ignoreRestSiblings: true,
    }],

    // Hooks rules
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',

    // JSX safety
    'react/jsx-no-duplicate-props': 'error',
    'react/jsx-no-undef': 'error',
    'react/no-direct-mutation-state': 'error',

    // Guard against the dangling-comma-in-string bug pattern
    // No automated rule exists for this — caught by prezip-check.js #11

    // Allow empty catch blocks (common in Jiff for graceful fallback)
    'no-empty': ['warn', { allowEmptyCatch: true }],
  },
  env: {
    browser: true,
    es2021: true,
  },
};
