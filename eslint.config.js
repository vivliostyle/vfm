// @ts-check

import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import gitignore from 'eslint-config-flat-gitignore';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/**
 * @see https://typescript-eslint.io/getting-started
 * @see https://eslint.org/docs/latest/use/configure/migration-guide#configure-language-options
 */
const eslintConfig = defineConfig(
  gitignore(),
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
  },
);

export default eslintConfig;
