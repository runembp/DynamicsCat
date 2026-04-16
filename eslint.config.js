// @ts-check
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

const chromeGlobals = { chrome: 'readonly' };

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // Background service worker
  {
    files: ['src/background.ts'],
    languageOptions: {
      globals: { ...globals.serviceworker, ...chromeGlobals },
    },
  },

  // Popup scripts
  {
    files: ['src/popup/**/*.ts'],
    languageOptions: {
      globals: { ...globals.browser, ...chromeGlobals },
    },
  },

  // Content scripts (browser globals + Xrm for CRM pages)
  {
    files: ['src/content/**/*.ts'],
    languageOptions: {
      globals: { ...globals.browser, ...chromeGlobals, Xrm: 'readonly' },
    },
  },

  // Build scripts (Node.js)
  {
    files: ['build.js'],
    languageOptions: {
      globals: globals.node,
    },
  },
);
