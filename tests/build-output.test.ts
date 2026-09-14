import { XMLParser, XMLValidator } from 'fast-xml-parser';
import { beforeAll, describe, expect, it } from 'vitest';
import {
  distExists,
  distFileExists,
  fileSize,
  gzipSize,
  listHtmlFiles,
  readDist,
} from './lib/dist';
import { extractHrefs, isInternalHref, resolvesInDist } from './lib/links';

// ADR-11 layer 2: assertions on the actual generated artifact, which is
// what a reader receives. Requires `dist/` to already exist — run
// `npm run build` first (that's what `npm run test:build-output` does).

const KB = 1024;
const NOINDEX_PATHS = new Set(['/search/', '/404.html']);

function pageScriptBytes(html: string): number {
  let total = 0;
  const modulePattern = /<script type="module"[^>]*>([\s\S]*?)<\/script>/g;
  let match: RegExpExecArray | null;
  while ((match = modulePattern.exec(html))) {
    total += Buffer.byteLength(match[1], 'utf-8');
  }
  const srcPattern = /<script[^>]*\ssrc="([^"]+)"[^>]*>/g;
  while ((match = srcPattern.exec(html))) {
    if (distFileExists(match[1])) total += fileSize(match[1]);
  }
  return total;
}

function urlPathFor(htmlFile: string): string {
  return htmlFile === '/404.html' ? '/404.html' : htmlFile.replace(/index\.html$/, '');
}

beforeAll(() => {
  if (!distExists()) {
    throw new Error(
      'dist/ does not exist — run `npm run build` before `npm run test:build-output`.',
    );
  }
});

describe('drafts never reach production', () => {
  it('excludes the draft post entirely — no file, no path, no reference', () => {
    for (const file of listHtmlFiles()) {
      const html = readDist(file);
      expect(html).not.toContain('a-draft-in-progress');
      expect(html).not.toContain('A Draft in Progress');
    }
    expect(distFileExists('essays/a-draft-in-progress/index.html')).toBe(false);
  });
});

describe('SEO tags present in served HTML (spec.md §9)', () => {
  const htmlFiles = listHtmlFiles();

  it.each(htmlFiles)('%s has a title, meta description, and OG tags', (file) => {
    const html = readDist(file);
    expect(html).toMatch(/<title>[^<]+<\/title>/);
    expect(html).toContain('<meta name="description"');
    expect(html).toContain('<meta property="og:title"');
    expect(html).toContain('<meta property="og:description"');
  });

  it.each(htmlFiles.filter((f) => !NOINDEX_PATHS.has(urlPathFor(f))))(
    '%s (indexable) has a canonical URL and an OG image',
    (file) => {
      const html = readDist(file);
      expect(html).toContain('<link rel="canonical"');
      expect(html).toContain('<meta property="og:image"');
    },
  );

  it.each([...NOINDEX_PATHS])('%s is marked noindex', (path) => {
    const file = path === '/404.html' ? '/404.html' : `${path}index.html`;
    const html = readDist(file);
    expect(html).toContain('<meta name="robots" content="noindex">');
  });
});

describe('weight budgets (spec.md §11, compressed)', () => {
  it('every page ships 0 KB of JS, except /search/ which stays under 20 KB', () => {
    for (const file of listHtmlFiles()) {
      const bytes = pageScriptBytes(readDist(file));
      if (urlPathFor(file) === '/search/') {
        // Uncompressed byte count — a conservative (larger) bound than the
        // gzip-compressed budget every other row in spec.md §11 is stated in.
        expect(bytes).toBeLessThan(20 * KB);
      } else {
        expect(bytes, `${file} should ship 0 KB of JS`).toBe(0);
      }
    }
  });

  it('the theme CSS (shared file + inlined preset) stays under 20 KB compressed', () => {
    // base.css is structural and never varies per build, so it's a real
    // external, cacheable stylesheet under dist/_astro/. The active preset
    // is a build-time choice from site.config.ts, which can't participate
    // in Astro's static per-page CSS-link analysis (that needs a literal,
    // unconditional import) — it's inlined as a <style> tag instead
    // (BaseLayout.astro). Both count against the one CSS budget.
    const html = readDist('/index.html');
    const linkMatch = html.match(/href="(\/_astro\/[^"]+\.css)"/);
    expect(linkMatch, 'expected a bundled theme stylesheet link on the home page').toBeTruthy();
    const externalCss = readDist(linkMatch![1]);

    const inlineMatch = html.match(/<style>([\s\S]*?)<\/style>/);
    expect(inlineMatch, 'expected the preset to be inlined as a <style> tag').toBeTruthy();
    const inlineCss = inlineMatch![1];

    expect(gzipSize(externalCss) + gzipSize(inlineCss)).toBeLessThan(20 * KB);
  });

  it('every page stays under 30 KB of HTML, compressed', () => {
    for (const file of listHtmlFiles()) {
      expect(gzipSize(readDist(file)), file).toBeLessThan(30 * KB);
    }
  });
});

describe('sitemap.xml and rss.xml (spec.md §9)', () => {
  const sitemapIndex = readDist('/sitemap-index.xml');
  const sitemap = readDist('/sitemap-0.xml');
  const rss = readDist('/rss.xml');

  it('are well-formed XML', () => {
    expect(XMLValidator.validate(sitemapIndex)).toBe(true);
    expect(XMLValidator.validate(sitemap)).toBe(true);
    expect(XMLValidator.validate(rss)).toBe(true);
  });

  it('sitemap excludes the draft and the search page', () => {
    expect(sitemap).not.toContain('a-draft-in-progress');
    expect(sitemap).not.toContain('/search/');
  });

  it('sitemap includes the home page and every published post', () => {
    expect(sitemap).toContain('<loc>https://example.akshar.dev/</loc>');
    expect(sitemap).toContain('/essays/on-owning-your-words/');
    expect(sitemap).toContain('/poems/a-quiet-hour/');
  });

  it('rss.xml contains every published post and not the draft', () => {
    const parser = new XMLParser();
    const parsed = parser.parse(rss);
    const items = parsed.rss.channel.item;
    const titles = (Array.isArray(items) ? items : [items]).map(
      (item: { title: string }) => item.title,
    );
    expect(titles).toContain('On Owning Your Words');
    expect(titles).toContain('A Quiet Hour');
    expect(titles).not.toContain('A Draft in Progress');
  });
});

describe('no internal link 404s', () => {
  const htmlFiles = listHtmlFiles();

  it.each(htmlFiles)('%s has no broken internal link', (file) => {
    const html = readDist(file);
    const broken = extractHrefs(html)
      .filter(isInternalHref)
      .filter((href) => !resolvesInDist(href));
    expect(broken, `broken links on ${file}`).toEqual([]);
  });
});
