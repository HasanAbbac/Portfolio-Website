import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['dist/**', 'node_modules/**', 'public/**', '.model-cache/**'] },
  js.configs.recommended,
  { files: ['src/**/*.js'], languageOptions: { ecmaVersion: 2023, sourceType: 'module', globals: globals.browser } },
  { files: ['scripts/promo/promo.js'], languageOptions: { ecmaVersion: 2023, sourceType: 'module', globals: globals.browser } },
  { files: ['api/**/*.js', 'server/**/*.js', 'scripts/**/*.mjs', 'test/**/*.js', 'vite.config.js', 'eslint.config.js'], languageOptions: { ecmaVersion: 2023, sourceType: 'module', globals: { ...globals.node, fetch: 'readonly' } } },
  // browser tests: Node code plus functions that Playwright runs inside the page (so browser globals are valid too)
  { files: ['test/e2e/**/*.mjs'], languageOptions: { ecmaVersion: 2023, sourceType: 'module', globals: { ...globals.node, ...globals.browser } } },
  { rules: { 'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true, caughtErrors: 'none' }] } },
];
