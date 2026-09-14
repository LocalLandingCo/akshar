# CLAUDE.md

How this codebase actually works, and which details are load-bearing.
Read [`mission.md`](./mission.md), [`spec.md`](./spec.md), and
[`tech-stack.md`](./tech-stack.md) first — this file assumes them and
explains implementation, not intent. If a change doesn't trace back to
something in those three documents, that's worth pausing on before making
it (mission.md's own framing).

## The shape of the repo

This is a **template repository** (ADR-6), not a monorepo with a package
boundary. The root of this repo is simultaneously: the engine
(`src/lib/`, `src/pages/`), the one shipped theme (`src/themes/default/`),
the preset set (`src/presets/`), and — deliberately — **the example site
itself**. `site.config.ts` and everything under `content/` at the repo
root are real, working demo content, not a separate `examples/` fixture.
This is why there's no `examples/` directory even though tech-stack.md §4
mentions one: in the single-repo template model (as opposed to a future
npm-package core), the root _is_ that fixture, and duplicating it would
just be two things to keep in sync. Build-output assertions
(`tests/build-output.test.ts`) run against this real content, which is
also what keeps it from going stale.

```
site.config.ts          ← the one thing a writer/helper edits site-wide
content/                ← the writer's actual words; never touched by core
src/
  content.config.ts       ← content collections + Zod schemas (ADR-10)
  pages/                    ← routes — CORE, reads content + config, never styles anything
  lib/                        ← core logic: urls, seo, search, a11y, cms, theme contract
  presets/                      ← token-only CSS files, theme-agnostic by construction
  themes/default/                  ← the one shipped theme: layouts + base.css + strings.ts
.github/workflows/           ← ci.yml (validate) and deploy.yml (build + deploy)
docs/, AUTHORING.md            ← what they say on the tin
```

## The core/theme boundary, concretely

Every route file under `src/pages/` follows the same shape: fetch content
via `getCollection`, run it through pure helpers in `src/lib/content/`,
compute SEO data via `src/lib/seo/`, then hand a **plain, fully-resolved
props object** to a theme layout. A theme layout never imports
`astro:content`, never calls `getCollection`, and never builds a URL with
string concatenation — it only reads props typed by
`src/lib/theme/contract.ts`. That file is the actual contract; everything
in `docs/theme-contract.md` is a human-readable description of it, not the
other way around.

**Why this matters for changes:** if you're editing something in
`src/themes/default/` and find yourself wanting to import from
`astro:content` or `site.config.ts` directly, that's a sign the data
should be computed in the calling route instead and passed down as a prop.
The one sanctioned exception is `BaseLayout.astro`, which reads
`siteConfig.theme.preset` / `.tokens` / `.analytics` directly — those are
genuinely site-wide, not per-page, concerns.

## Things that look like bugs but aren't

- **A post's `cover` field is a Zod union, order matters.**
  (`src/content.config.ts`) `z.union([z.string().startsWith('/'), image()])`
  — the plain-string check must come _first_. Astro's `image()` schema
  doesn't fail soft on a path it can't resolve as a relative file; it
  throws immediately. If a CMS-uploaded cover (`/images/x.jpg`, absolute)
  ever hit `image()` first, the build would crash on every post with a
  CMS-uploaded cover. See the comment right above it, and
  `src/themes/default/components/Cover.astro`, which renders whichever
  form it got (processed `<Picture>` vs. a plain `<img>`).

- **`src/lib/theme/presets.ts` resolves paths from `process.cwd()`, not
  `import.meta.url`.** It used to use Vite's `import.meta.glob`, which
  works in the normal dev/build pipeline but not in `scripts/generate-cms-
config.ts` (plain `tsx`, no Vite). Before that, it used
  `fs.readFileSync(new URL(..., import.meta.url))`, which worked
  everywhere _except_ Astro's prerendered output — that step relocates
  the compiled SSR module into `dist/.prerender/chunks/`, so a path built
  from the module's own (now-moved) location resolved to the wrong place.
  `process.cwd()` is the one thing that's stable across all three contexts
  (Vite pipeline, prerender, standalone script) because every entry point
  that reaches this file is invoked from the project root.

- **`generatePostId`/`generatePageId` (`src/lib/content/id.ts`) are custom,
  not Astro's default.** Astro's own default id-generator folds a `slug`
  frontmatter override into the _entire_ entry id — for a post, that
  would silently drop the folder-derived section the moment a writer sets
  a custom slug. Section and slug are derived independently here on
  purpose, matching spec.md §4 exactly ("folder → section, filename →
  slug — overridable").

- **`isVisible` vs. `isPublished` for posts** (`src/lib/content/posts.ts`).
  `isPublished` is just `!draft`. `isVisible` additionally checks
  `!import.meta.env.PROD` — used in every `getStaticPaths` and every
  listing, so a draft gets a real route in `astro dev` (previewable) but
  literally no route at all in `astro build` (not hidden — absent). Don't
  swap these; using `isPublished` alone in a route would make a draft's
  page 404 in dev too, and using `isVisible` for something that isn't
  gating a route/listing is usually a sign you wanted `isPublished`.

- **The theme CSS is split between one external file and an inline
  `<style>` per page**, and that's intentional
  (`src/themes/default/layouts/BaseLayout.astro`,
  `astro.config.mjs`'s `build.inlineStylesheets: 'never'`). `base.css`
  never varies between builds, so it's a genuine external, cacheable
  stylesheet. The active _preset_, though, is a build-time choice from
  `site.config.ts` — it can't be a literal `import 'x.css'` (that would
  hardcode one preset), and a value chosen at build time can't
  participate in Astro's static per-page CSS-link analysis. It's inlined
  as text instead. `tests/build-output.test.ts`'s CSS budget check sums
  both for exactly this reason.

- **Lighthouse CI (`.lighthouserc.cjs`) deliberately excludes `/search/`
  and `/404.html`.** Both are intentionally `noindex`. Lighthouse's SEO
  category scores `noindex` as a failure regardless of _why_ it's there —
  confirmed by actually running it (search alone scored 0.66). Don't add
  them back to the URL list without also reconsidering the assertion
  thresholds.

- **`deploy.yml`'s gate is `npm run test:build-output`, not the full CI
  suite.** It deliberately skips lint/format (irrelevant to a
  content-only commit — and the hosted CMS commits straight to `main`,
  same path as any code push) and Lighthouse (slow, and has enough
  run-to-run variance that gating a writer's publish on it would produce
  occasional false failures for reasons unrelated to their post). Both
  still run on every push via `ci.yml`.

## Testing layers, and where a new test belongs

Three layers (ADR-11), and each one has a specific job — don't reach for
the wrong one:

1. **`src/**/*.test.ts`** (`npm run test`) — pure logic only, no `dist/`
   needed. Slug/id derivation, excerpt derivation, contrast math, search
   ranking, the CMS config generators. Fast; runs on every `npm test`.
2. **`tests/build-output.test.ts`** (`npm run test:build-output`, which
   builds first) — assertions on the actual generated files: every page's
   SEO tags, weight budgets, sitemap/RSS correctness, no broken internal
   link. If you're checking something about what a _reader_ actually
   receives, it goes here, not layer 1.
3. **`.lighthouserc.cjs`** (`npm run lhci`) — the ≥95 score budgets. Only
   representative, indexable pages (see the exclusion note above).

## Content model quirks worth knowing

- A post's `section` is never a frontmatter field — it's derived
  entirely from which folder under `content/posts/` the file lives in.
  Trying to add a `section:` field to a post's frontmatter does nothing;
  the schema doesn't even define one.
- Tags are NFC-normalized in the schema itself
  (`src/content.config.ts`), not downstream — so `getAllTags` and the
  search index never have to think about it. The same normalization
  happens to post/page slugs derived from filenames
  (`src/lib/content/id.ts`). This is directly because a browser CMS, a
  phone keyboard, and a paste can each produce a different byte sequence
  for the same visible character.
- `coverAlt` is required _only if_ `cover` is set — enforced in
  `content.config.ts`'s `.check()`, not by making the field itself
  required. Accessibility is enforced at the point it's actually needed,
  not unconditionally.

## Running things locally

`npm run dev` for the site. `npm run cms` (a thin wrapper around
`decap-server`) in a second terminal for the local editor backend, then
open `/admin/` and choose "Work with Local Repository" — no login, no
network. Note: this specific combination has shown a routing quirk where
`astro dev`'s dev server 404s on `/admin/` even though the file exists
under `public/admin/`; `astro build && astro preview` serves it correctly
and is what was used to verify the CMS integration in this codebase's own
history. If you hit the same thing, that's the workaround; if you find the
actual cause, it's worth fixing properly.
