// @ts-check
import eslint from '@eslint/js';
import eslintPluginAstro from 'eslint-plugin-astro';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  ...eslintPluginAstro.configs.recommended,
  {
    ignores: ['dist/', '.astro/', 'node_modules/'],
  },
  {
    rules: {
      // A non-technical writer's content must never fail a build silently —
      // core logic prefers loud, typed errors over `any` escape hatches.
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
);
