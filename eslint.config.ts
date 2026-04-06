import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/**
 * @see https://typescript-eslint.io/getting-started - basic config setup
 * @see https://eslint.org/docs/latest/use/configure/migration-guide#configure-language-options - migrating env to globals
 * @see https://github.com/eslint/eslint/issues/19985 - eslint.config.ts requires unstable_native_nodejs_ts_config flag or jiti
 */
const eslintConfig = defineConfig(
  eslint.configs.recommended,
  tseslint.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      globals: {
        ...globals.es2020,
        ...globals.node,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      'no-console': 'error',
    },
    ignores: [
      'packages/remark-attribute/src/code-fenced.js',
      'packages/remark-attribute/src/factory-attributes.js',
    ],
  },
);

export default eslintConfig;
