// @ts-check
import { defineConfig } from 'astro/config';

// site / base / integrations (RSS, sitemap, deployment adapter) are wired in
// later phases, from the single source of truth in `site.config.ts` — see
// tech-stack.md ADR-9 and spec.md §13 on why nothing host-specific belongs here.
export default defineConfig({});
