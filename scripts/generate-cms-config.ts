// Regenerates the CMS config files from site.config.ts. Run this after
// changing sections, the repository, or anything else the CMS needs to
// know about — it's not part of the Astro build (both outputs are
// version-controlled inputs to a third-party product, not build artifacts:
// .pages.yml is read directly from the repo by app.pagescms.org, and
// public/admin/config.yml needs to exist before `astro build` even starts
// so it ends up in dist/admin/ unchanged).
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import siteConfig from '../site.config';
import { generateDecapConfig } from '../src/lib/cms/decap';
import { generatePagesCmsConfig } from '../src/lib/cms/pages-cms';

const root = fileURLToPath(new URL('..', import.meta.url));

function write(relativePath: string, content: string) {
  const fullPath = resolve(root, relativePath);
  mkdirSync(dirname(fullPath), { recursive: true });
  writeFileSync(fullPath, content.endsWith('\n') ? content : `${content}\n`);
  console.log(`wrote ${relativePath}`);
}

write('.pages.yml', generatePagesCmsConfig(siteConfig));
write('public/admin/config.yml', generateDecapConfig(siteConfig));
