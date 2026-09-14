# The theme contract

This is the versioned promise spec.md §7 and tech-stack.md ADR-6 describe.
There's one theme in the MVP (`src/themes/default/`) — this document is
what a theme #2 would have to honor, and what makes a **preset** (a much
smaller thing — see below) safe to write without reading any Astro code.

**The rule:** the core (`src/lib/`, `src/pages/`) owns what pages exist,
what data they get, what URLs they have, and what goes in `<head>`. A
theme owns what they look like. A theme never reads the filesystem, never
parses content, never constructs a URL, and never emits its own SEO tags —
it receives fully-resolved data and renders it. A broken theme produces an
ugly site, never a broken one.

## What a theme must provide

A layout (`.astro` file) for every core route, each consuming _only_ the
documented props below (`src/lib/theme/contract.ts` is the literal source
of truth — this document explains it, that file is authoritative if they
ever disagree):

| Route                | Layout               | Key props                                                                      |
| -------------------- | -------------------- | ------------------------------------------------------------------------------ |
| `/`                  | `Home.astro`         | `site`, `strings`, `posts: PostSummary[]`, `canonicalUrl`, `image?`, `jsonLd?` |
| `/<section>/`        | `SectionIndex.astro` | `site`, `strings`, `section`, `posts`, `canonicalUrl`, `image?`                |
| `/<section>/<slug>/` | `Post.astro`         | `site`, `strings`, `post: PostFull`, `image?`, `jsonLd?`                       |
| `/<slug>/` (pages)   | `Page.astro`         | `site`, `strings`, `page: PageFull`, `image?`                                  |
| `/tags/<tag>/`       | `TagIndex.astro`     | `site`, `strings`, `tag`, `posts`, `canonicalUrl`, `image?`                    |
| `/archive/`          | `Archive.astro`      | `site`, `strings`, `posts` (sorted, newest first), `canonicalUrl`, `image?`    |
| `/search/`           | `Search.astro`       | `site`, `strings`, `tags`, `archiveHref`, `canonicalUrl`                       |
| `/404`               | `NotFound.astro`     | `site`, `strings`                                                              |

`BaseLayout.astro` wraps all of them: it owns `<html>`, injects the active
preset's CSS and any token overrides, calls the core's `SEOHead` component
(title, canonical, OG/Twitter, JSON-LD — a theme never writes these tags
itself), and renders the header/nav/footer chrome from `site.nav`.

## Design tokens

CSS custom properties, defined by a **preset** (`src/presets/*.css`), not
by the theme. A theme's `.astro`/`.css` files reference them via `var(--…)`
and never hardcode a color or a font. The full set, with what each is for:

| Token                                        | Purpose                                                                                                     |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `--color-bg`, `--color-surface`              | Page background, and a slightly-different surface (cards, code blocks).                                     |
| `--color-text`, `--color-muted`              | Body text, and secondary/meta text.                                                                         |
| `--color-border`                             | Dividers, input borders — checked at ≥3:1 (WCAG "UI boundary").                                             |
| `--color-primary`, `--color-on-primary`      | The site title, buttons, skip-link — and text that sits on that color.                                      |
| `--color-accent`, `--color-on-accent`        | Focus outlines, the search button, and text on it.                                                          |
| `--color-link`, `--color-link-visited`       |                                                                                                             |
| `--font-sans`, `--font-serif`, `--font-mono` | Raw stacks; `--font-body` and `--font-ui` pick which one is used where.                                     |
| `--font-body`, `--font-ui`                   | Body copy vs. interface chrome (nav, meta, labels) — a preset can point these at different families.        |
| `--text-sm` … `--text-2xl`                   | The type scale.                                                                                             |
| `--leading-body`, `--leading-heading`        | Line height.                                                                                                |
| `--letter-spacing-body`                      | Load-bearing for the Devanagari preset (`ol.css`) — set for the script, not inherited from a Latin default. |
| `--space-1` … `--space-6`                    | The spacing scale.                                                                                          |
| `--radius`                                   | Corner rounding — near-zero for a dense/serious preset, large for a soft one.                               |
| `--measure`                                  | Body-text column width, in `ch` units.                                                                      |

All eleven color pairs above are contrast-checked in CI
(`src/presets/presets.test.ts`) — 4.5:1 for text, 3:1 for the border — for
every preset, in both its default state and its `prefers-color-scheme:
dark` override where it has one. A preset that doesn't pass doesn't merge.

## UI strings

Every piece of interface text — "Home", "Published on…", "N min read", the
search prompt, the 404 message — is a value in `UIStrings`
(`src/lib/theme/contract.ts`), implemented per-theme in `strings.ts`
(`src/themes/default/strings.ts` is the English default). A theme with
Marathi or Hindi interface copy replaces that one file; nothing else
changes. This is the direct fix for [REF]'s biggest reuse failure — UI
strings hardcoded across a dozen components made it unusable in any other
language without a fork.

## Presets vs. themes

A **preset** is _only_ a token file — no layout, no logic, no UI strings.
Writing one is much lower-stakes than the layout contract above: match the
token list, pass the accessibility test, and it works with the one theme
today and any future theme, because it never touches anything but tokens.
The six shipped presets (`src/presets/`) are also the worked examples for
what "genuinely distinct" means: they span warm/cool, serif/sans,
dense/airy, and light-default/dark-default (spec.md §7's explicit
requirement, so the set doesn't collapse into "six shades of grey").
