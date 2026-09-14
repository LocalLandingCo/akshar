import { defineConfig } from 'vitest/config';

// Build-output assertions (ADR-11, layer 2) — a separate config from
// vitest.config.ts so the fast unit-test loop (`npm run test`) never
// requires a `dist/` to exist. Run via `npm run test:build-output`, always
// after `npm run build`.
export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
  },
});
