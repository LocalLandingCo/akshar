// Points Git at the hooks checked into .githooks/, so `npm install` is the
// only setup step a contributor needs (tech-stack.md §3 — "deliberately
// minimal; heavy hooks get bypassed"). No-ops outside a git checkout (e.g.
// installing from a tarball) or if git isn't on PATH.
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';

if (existsSync('.git')) {
  try {
    execFileSync('git', ['config', 'core.hooksPath', '.githooks']);
  } catch {
    // Non-fatal: git not available. Hooks are a convenience, not a requirement.
  }
}
