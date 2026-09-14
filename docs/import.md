# Content import

For a helper or developer-writer bringing an existing archive into Akshar
— one local command, run once, that reads a platform's export file and
writes ordinary Markdown into `content/`. It's not part of the site build,
not in `/admin`, and not a service (spec.md §18). This document is
Phase I-0's contract: what every source adapter produces, how that becomes
a real post, and exactly what the CLI does. `src/lib/import/types.ts` is
the actual TypeScript this describes — read that file if the two ever
disagree.

## Status

**Phase I-0 (this document + fixtures): done.** Phases I-1 (the shared
pipeline), I-2 (WordPress + Blogger adapters), and I-3 (Substack, guards,
docs polish, CI) are not built yet — this is the contract they'll be built
against, agreed and fixture-tested first, per spec.md §21's own delivery
plan.

## The pipeline

```
Platform export file ──▶ source adapter ──▶ NormalizedRecord[] ──▶ shared pipeline ──▶ content/ + report
                          (WordPress/Blogger/Substack-specific)      (written once, for every source)
```

A **source adapter**'s only job is turning one platform's export format
into an array of `NormalizedRecord` (below). Nothing platform-specific
exists past that point — the HTML→Markdown conversion, image handling,
NFC normalization, draft rules, and file-writing are all in the shared
pipeline, implemented once.

## The normalized intermediate record

```ts
interface NormalizedRecord {
  kind: 'post' | 'page';
  title: string;
  date: Date; // timezone-aware parsing is the adapter's job
  slug: string; // from the source; percent-decoded, NFC-normalized, never empty
  htmlBody: string; // raw HTML — not yet converted
  categories: string[];
  tags: string[]; // distinct from categories where the platform has both
  excerpt?: string;
  featuredImage?: { url: string; alt?: string };
  status: 'published' | 'draft' | 'private' | 'scheduled' | 'paid';
  authorName: string; // display name only — for --author filtering, never written to output
  originalUrl: string; // feeds the URL-map CSV, never written to frontmatter
}
```

## Mapping a record to a post

| Frontmatter field    | From                  | Fallback / rule                                                                                                                                                                                                                                                                                                                                                 |
| -------------------- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `title`              | `title`               | Always present — a record with no title is dropped and reported.                                                                                                                                                                                                                                                                                                |
| `date`               | `date`                | Used as-is (already a real `Date`).                                                                                                                                                                                                                                                                                                                             |
| _(filename → slug)_  | `slug`                | The record's slug becomes the output filename directly — "filename is the slug" already holds for imported content, no separate frontmatter `slug:` override needed. A collision (two records resolving to the same slug within a section) gets a numeric suffix on **both** the filename and the effective slug, and is reported — never silently overwritten. |
| _(folder → section)_ | `categories`          | The `--section-map` file (a JSON object, source category → declared section id) decides. An unmapped category's posts go to the default/first declared section, and every source category is listed in the report's suggested-sections snippet either way.                                                                                                      |
| `tags`               | `categories` + `tags` | Categories become tags by default (see above — only when _not_ consumed by the section mapping); the platform's own tags are always tags. Merged, de-duplicated, NFC-normalized (content.config.ts already normalizes on read, but the importer normalizes on write too, so a diff against a previous import is clean).                                         |
| `excerpt`            | `excerpt`             | Omitted if the source doesn't have one — the normal derive-from-body fallback (`src/lib/content/posts.ts`) applies exactly as it would for a hand-written post.                                                                                                                                                                                                 |
| `cover` / `coverAlt` | `featuredImage`       | Set **only** when `featuredImage.alt` is present. Otherwise the image is still downloaded and saved, but no `cover:` field is written — the post is listed under "needs cover alt text" in the report, for the writer to add by hand. The importer never invents alt text (spec.md §10 — accessibility enforced, not guessed on someone's behalf).              |
| `draft`              | `status`              | `true` for anything except `'published'`. `'private'`, `'scheduled'`, and `'paid'` all count as held-back and are listed in the report by their specific status, not lumped together.                                                                                                                                                                           |
| `description`        | _(not set)_           | No source format has a distinct SEO-description field worth trusting over the excerpt; left for the writer to set if they want one.                                                                                                                                                                                                                             |
| body                 | `htmlBody`            | Converted to CommonMark + GFM (`turndown` + `turndown-plugin-gfm`), after `cheerio` strips scripts, iframes, forms, inline styles, and tracking pixels. Anything that can't be represented is dropped and reported by name ("a `<script>` tag", "a WordPress `[gallery]` shortcode"); an embed (video, social post) becomes a plain link to its original URL.   |

Never mapped to frontmatter, by design (spec.md §18, "Personal data"):
`authorName` (used only for `--author` filtering) and `originalUrl` (used
only for the URL-map CSV).

## The command

```
import <source> <export-path> [options]

  source        wordpress | blogger | substack
  export-path   Path to the platform's export file (WXR .xml, Blogger's
                Atom .xml, or Substack's .zip)

Options:
  --dry-run              Write only the report — no content/ changes.
  --overwrite             Allow overwriting a file that already exists
                            (default: skip it, and report the skip).
  --author <name>           Only import this author's posts; everyone
                              else's are skipped and reported. For
                              multi-author exports — Akshar itself stays
                              single-author (mission.md non-goals).
  --section-map <path>        A JSON file: { "Old Category": "section-id" }.
                                Omit it and every category becomes a tag;
                                the report always suggests one anyway.
```

Re-running the same command with the same export is safe: existing files
are skipped (not overwritten) unless `--overwrite` is passed, so importing
twice produces zero changes — verified by a dedicated idempotence test in
Phase I-3.

## The report

A Markdown file, written **outside** `content/` (so it's never deployed),
for a helper who'll explain it to a writer:

- **Counts** — posts, pages, and images imported; items skipped, grouped
  by reason.
- **Needs attention** — missing cover alt text, failed image downloads,
  slug collisions, and every held-back draft/private/scheduled/paid post,
  each with its actual status.
- **Per-post changes** — every dropped embed or unsupported HTML
  construct, by post.
- **A suggested `sections` snippet** — ready to paste into
  `site.config.ts`, derived from the source's categories.
- **A URL map**, as a separate `.csv` file next to the report (not
  embedded in the Markdown — a helper setting up redirects wants a plain
  table): two columns, `oldUrl,newPath`. Applying it is manual (spec.md
  §19 — automatic redirect generation is FUTURE); the importer's job ends
  at handing over the mapping.

## What the importer will never do

Everything in spec.md §18's "Explicitly not in scope" table holds: no
`/admin` upload screen, no CI-triggered import, no live API pulls or
stored platform credentials, no ongoing sync, and no import of comments,
subscribers, members, or stats — an export's subscriber/member file is
never even opened, let alone read (spec.md §18, "Personal data" — the
guarantee Phase I-3's guard test enforces across every fixture).

## Fixtures

Phase I-0 ships synthetic — never real — export fixtures for all three
MVP sources under `tests/fixtures/import/`, each covering the same set of
cases so the shared pipeline (Phase I-1) can be tested once against all
three:

- A Devanagari post (title, body, slug, and tags in Marathi).
- A draft, and a private/paid post (Substack).
- A cover image with no alt text.
- A broken/unreachable image URL.
- An embed (video or social post).
- A `<script>` tag and a tracking-pixel `<img>` in the body.
- A comment (proving it's never imported).
- A category (exercising the section-map/tag-fallback behavior).
- Substack only: a subscriber list file, never opened by the adapter —
  enforced by Phase I-3's guard test, not just by omission.

No fixture contains a real email address or any other real personal data
— every name, address, and account identifier in them is fabricated for
the test.
