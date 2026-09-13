import { defineConfig } from 'vitest/config';

// Unit tests over pure core logic (ADR-11, layer 1). Build-output assertions
// and Lighthouse CI are separate layers, added once there's a build to test.
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    // No core logic exists yet (Phase 0). Flip this off once Phase 1 adds
    // the first real unit tests — an empty suite should never be silently green.
    passWithNoTests: true,
  },
});
