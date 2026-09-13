# Akshar — Specification

> **What we are building.**
> Governed by [`mission.md`](./mission.md) (why). Implemented per [`tech-stack.md`](./tech-stack.md) (how).
> Anything in this document that doesn't trace to the mission is scope creep. Anything marked **FUTURE / NOT MVP** is not a requirement.

---

## 1. Product overview

**An open-source blog engine that turns a folder of Markdown files and one configuration file into a fast, accessible, self-owned static website — with a browser-based editor so a non-technical writer never has to see a terminal.**

The deliverable is not just an application. It is a **reusable foundation** consisting of six parts, which together let one system produce many independent publications:

```
        Reusable core engine
                 +
           Content model
                 +
          Site configuration
                 +
            Theme system
                 +
        Authoring interface
                 +
         Deployment pattern
```

```
                       AKSHAR (one engine, one theme contract)
                                     │
              ┌──────────────────────┼──────────────────────┐
              ▼                      ▼                      ▼
           Writer A               Writer B               Writer C
     content + config +     content + config +     content + config +
        theme choice           theme choice           theme choice
              │                      │                      │
              ▼                      ▼                      ▼
           Site A                 Site B                 Site C
    (own repo, own domain,   (own repo, own domain,  (own repo, own domain,
       own identity)            own identity)           own identity)
```

**The load-bearing constraint:** a new writer's site must be created without editing a single line of core code. If it can't be, the architecture is wrong — not the writer's requirements.

**What the MVP delivers, concretely:** a template repository a writer (or their helper) copies; a `site.config.ts` they fill in; a `content/` folder they write in; a browser editor at `/admin`; a push-to-deploy pipeline to free static hosting; a generated site with posts, pages, sections, tags, search, an archive, RSS, a sitemap, correct share previews, and no third-party JavaScript; and an importer that converts an existing WordPress, Blogger, or Substack archive into that same `content/` folder.

## 2. User personas

### Persona 1 — The Writer (site owner) · primary

Writes and publishes. Not a developer. Uses a laptop and a phone. Their success criteria:

- "I finished a piece. I want it online in five minutes, by myself."
- "I want to fix a typo without asking anyone."
- "I want to share a link and have it look right in WhatsApp."
- "I want my site to look like mine."
- "I don't want a bill, and I don't want to be responsible for a server."
- "I have years of posts on Blogger. I want them to come with me."

**Design consequence:** every authoring decision is judged against one question — _can they do this themselves, without touching code, git, or a terminal?_ This question came from the reference project and is retained verbatim because it was the single most useful filter in it.

### Persona 2 — The Reader · primary

Arrives from a shared link, a search engine, or a feed reader. Often on a mid-range phone on a slow connection. Wants to read the piece, possibly find more, possibly subscribe, and share it. Does not want to accept cookies, dismiss a popup, or wait for JavaScript.

**Design consequence:** a post page must render completely, and be fully readable and navigable, with zero JavaScript executed.

### Persona 3 — The Setup Helper · secondary

A developer or LocalLandingCo operator who stands the site up and hands over the keys. Cares about time-to-first-site, whether configuration actually covers what customers ask for, and whether they'll get support calls.

**Design consequence:** the setup path is documented, repeatable, and mostly mechanical. Everything a customer commonly asks to change must be reachable through configuration or a theme, never through a core edit.

### Persona 4 — The Contributor · secondary

Someone who found the project and wants to file an issue, fix a bug, or write a theme. Cares about a readable codebase, a stable theme contract, tests, and a clear scope so their PR isn't rejected on principle.

**Design consequence:** the theme contract is a documented, versioned promise. The codebase ships with tests, linting, and contribution guidelines. Non-goals are written down so contributors don't waste effort.

## 3. Core user journeys

### Journey A — First-time setup (the helper, or a technical writer) · target: under 30 minutes

```
Copy the template repository
          ↓
Fill in site.config.ts  (title, author, language, sections, theme, host)
          ↓
Add an avatar / logo and write the About page
          ↓
(optional) Import the writer's existing archive  (Journey F)
          ↓
Push to the writer's own Git repository
          ↓
CI builds and deploys to free static hosting
          ↓
(optional) Attach a custom domain
          ↓
Authorize the writer's browser editor at /admin
          ↓
Hand over: the site URL, the /admin URL, and the authoring guide
```

### Journey B — Publishing a post (the writer, every time) · target: under 5 minutes

```
Open /admin in a browser  →  Log in
          ↓
New post  →  choose a section
          ↓
Title · Date · Tags · Excerpt · Cover image (all optional but title)
          ↓
Write the body (rich-text or Markdown)
          ↓
Save as draft  →  preview
          ↓
Publish
          ↓
[automatic]  commit → build → deploy → live in a few minutes
          ↓
Copy the link and share it → the preview card shows THIS post
```

**Non-obvious requirement surfaced by the reference project:** the writer must be told, in the interface, that publishing takes a few minutes. Without that, a working system reads as a broken one. Perceived latency is a product requirement, not a documentation afterthought.

### Journey C — Editing published work

```
/admin  →  open the post  →  edit  →  Publish  →  rebuild → live
```

Identical to publishing. There is deliberately no separate "edit mode," "revision UI," or "unpublish" flow — Git already holds full history, and deleting a post in the editor is sufficient.

### Journey D — Reading

```
Arrive (shared link / search / feed)
          ↓
Read the post — fully rendered, no JS required
          ↓
Explore: same-section posts · tag · archive · search · newest
          ↓
Subscribe (RSS) or share (native share / copy link)
```

### Journey E — Leaving (must work, and must be easy)

```
The writer's content/ folder IS the export.
Plain Markdown + plain images + plain YAML, in a repo they own.
No conversion step. No request to us. No permission needed.
```

This journey is a feature and is tested like one.

### Journey F — Arriving from another platform (the helper, once) · target: under 60 minutes for ~200 posts

```
Writer downloads their export from WordPress / Blogger / Substack
          ↓
Helper runs one import command against it  (dry run first)
          ↓
Read the import report: what came across, what needs attention
          ↓
Fix the flagged items (cover alt text, sections, held-back drafts)
          ↓
Review the diff  →  commit  →  normal build & deploy
          ↓
(optional) Set up redirects from old URLs using the report's URL map
```

The mirror of Journey E. A writer should not have to abandon years of work in order to own it. It is performed by the helper during setup, not by the writer: it needs one local command, and the export file contains private data that must not pass through the writer's (often public) repository. Full requirements in §18.

## 4. Content model

Deliberately small. Every concept below justifies itself; conventional CMS concepts that don't are listed as excluded with the reason.

### Post — _required_

The core unit. One Markdown file with YAML frontmatter.

| Field         | Required | Notes                                                                                        |
| ------------- | -------- | -------------------------------------------------------------------------------------------- |
| `title`       | yes      |                                                                                              |
| `date`        | yes      | Publication date; drives ordering and the archive.                                           |
| `body`        | yes      | Markdown, below the frontmatter.                                                             |
| `slug`        | no       | Derived from the filename. Overridable for stable URLs when a title changes.                 |
| `section`     | no       | Derived from the containing folder.                                                          |
| `tags`        | no       | Free-form list.                                                                              |
| `excerpt`     | no       | Falls back to a derived summary of the body.                                                 |
| `cover`       | no       | Path to an image in the repo.                                                                |
| `coverAlt`    | no       | Required by validation _if_ `cover` is set — accessibility is enforced, not suggested.       |
| `draft`       | no       | `true` excludes it from production builds; it remains previewable locally and in the editor. |
| `description` | no       | SEO/share description override; falls back to `excerpt`.                                     |

**Conventions carried from the reference project because they were proven:** the file's name is the slug, and the containing folder is the section. Both need zero configuration, keep the URL visible in the filesystem, and make a mis-filed post obvious. Frontmatter is parsed with a real YAML parser, never a hand-rolled one — a browser-based editor emits multi-line YAML lists that naive parsers mangle.

### Page — _required_

A standalone document outside the date-ordered stream: About, Contact, Now, Colophon. Same file format, no `date` ordering, no tags, URL is `/<slug>`. Required in MVP because every real writer site has at least an About page, and the reference project needed one immediately.

### Section — _required, configuration not content_

A named group of posts (the generalization of the reference project's poetry / articles / ukhane). Declared in `site.config.ts`:

```ts
sections: [{ id: 'posts', label: 'Writing', description: '…' }];
```

A section supplies an id (URL segment and folder name), a display label, and optional description and ordering. **Default: one section, `posts`.** A writer who never thinks about sections gets a single flat blog and never sees the concept. A writer who wants "Essays / Poems / Notes" declares three.

**Deliberately not stored as content files.** The reference project proved the failure mode in both directions: it duplicated its category list across six files until a phase was spent consolidating it, _and_ it carried a fourth category that no route, folder, or navigation entry referenced. One declaration, in the file that already defines the site, is the answer.

### Tag — _required, derived_

Tags are strings on posts. There is no tag entity, no tag description, no tag metadata file. The set of tags is derived from the corpus at build time. Cheap, useful, zero maintenance — proven in the reference project.

### Author — _required, configuration not content_

The MVP is single-author. The author is `site.config.ts`: name, short bio, avatar, links. It feeds the byline, the About page, `Person` structured data, and feed metadata. **Not a content type**, because modelling an author collection to hold exactly one record is the kind of speculative generality the mission rules out. Multi-author is FUTURE and is designed around — nothing in the content model forbids adding a per-post `author` field later.

### Media — _required_

Images live in the repo alongside content. The writer uploads through the editor; the build optimizes them (see §11). Formats: JPEG, PNG, WebP, AVIF, SVG, GIF. Non-image attachments (PDF) are served as-is.

**Hard rule learned from a live bug in the reference project:** nothing outside `content/` may reference a content image by hardcoded path. There, a category's default thumbnail pointed at a file the author later deleted through the editor — silently breaking a page nothing was watching. Here, image references exist only in frontmatter and body, are validated at build time, and a missing image fails the build rather than shipping.

### Navigation — _required, derived with an override_

Derived by default: Home, one entry per section, each page, plus search/archive/feed where the theme supports them. Overridable in config with an explicit ordered list, including external links. Derivation-by-default means the common case needs no configuration; the override exists because navigation order is one of the first things anyone wants to change.

### Site configuration — _required_

One file, described in §8. This is the single most important structural improvement over the reference project.

### SEO metadata — _required, derived_

Never authored by hand. Every title, description, canonical URL, Open Graph tag, and structured-data block is generated from the content model and site config (§9). Per-post overrides exist for the few fields worth overriding.

### Excluded from the MVP content model — and why

| Concept                                          | Why not                                                                                                                                                |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Categories _and_ tags**                        | Two taxonomies for one small corpus is a decision the writer must make repeatedly for no benefit. Sections are the coarse axis; tags are the fine one. |
| **Series / collections**                         | Real, but uncommon. A tag covers it. FUTURE.                                                                                                           |
| **Comments**                                     | Mission non-goal — needs a server and moderation.                                                                                                      |
| **Related posts (computed)**                     | Same-section + shared-tag lists cover it. Similarity scoring is FUTURE.                                                                                |
| **Content blocks / structured page composition** | This is a blog, not a website builder.                                                                                                                 |
| **Reader accounts, subscriptions, newsletters**  | Mission non-goals.                                                                                                                                     |
| **Localization / translated post variants**      | _Writing in any language_ is MVP and non-negotiable. _One post in multiple languages_ is a genuinely large feature with a small audience here. FUTURE. |

## 5. Publishing model

**Decision: Markdown files with YAML frontmatter, stored in Git, rendered to static HTML at build time.** Full reasoning in [`tech-stack.md`](./tech-stack.md) (ADR-1, ADR-3, ADR-4). What it means functionally:

- **The content format is Markdown** (CommonMark + GFM: tables, strikethrough, task lists, autolinks). Plain text a human can read in any editor, in twenty years, with no tooling.
- **Raw HTML in Markdown is disabled by default.** It breaks portability, breaks theme consistency, and turns the browser editor into an injection surface. A config flag can enable it, with sanitization, for a writer who knows what they're doing.
- **MDX is rejected for the MVP.** It makes content executable code — unportable, unreadable outside this toolchain, impossible to edit safely in a non-technical CMS, and a security surface. The content-first mission points the other way. A small set of theme-provided shortcodes is a better answer if the need appears. FUTURE.
- **Git is the database.** Version history, authorship, backup, rollback, and diffing come free and are already best-in-class. There is no runtime content store.
- **Every change is a commit; every commit triggers a build; every build is a full static site.** The published site is the artifact, not a rendering of live state.

**Why this is right for the audience, in one line:** it is the only model where the writer's complete archive is simultaneously the input format, the backup, and the export.

## 6. What "CMS" means here

The word is doing real work in the project name, and being imprecise about it would be an architectural error.

**This is a Git-based CMS over a static site generator.** There is no content server, no content database, and no content API. "Content management" means: a web interface that reads and writes Markdown files in the writer's Git repository, and a build pipeline that turns those files into a website.

```
 Writer ──▶ Browser editor (/admin) ──▶ commit to Git repo
                                              │
 Writer ──▶ Text editor + git ────────────────┤   (both paths, same files)
                                              ▼
                                    CI build (static generation)
                                              │
                                              ▼
                                     Static host ──▶ Reader
```

The reference project validated this end-to-end: a non-technical author with no terminal published real posts to a live site. That result is the single strongest piece of evidence this project has, and it is the reason this model is chosen rather than reasoned toward.

### The three authoring tiers

All three write the same files. A writer can move between them at any time, and mix them.

| Tier                  | Who                          | How                                                    | Infrastructure needed                     |
| --------------------- | ---------------------------- | ------------------------------------------------------ | ----------------------------------------- |
| **0 — Files**         | Developer-writer             | Edit Markdown, commit, push                            | None                                      |
| **1 — Local editor**  | Anyone, on their own machine | One command starts the editor at `localhost`, no login | None                                      |
| **2 — Hosted editor** | The primary persona          | Log in with their Git account, publish                 | **None**, on the default path (see below) |

**Tier 2 is the MVP's headline capability** — it is what makes the primary persona possible. But it carries the project's one genuinely hard constraint, and the spec is explicit about it:

> A Git-based editor running in a browser needs a server-side OAuth token exchange, because a client secret cannot live in a public page. That exchange is the **only** part of this system that is not static.

The reference project solved this by deploying a dedicated Cloudflare Worker. It works, but for this product it is a **defect in the deployment story**: it means a second service, a second vendor account, secrets to manage, and a piece of infrastructure the writer now owns — violating "no server to babysit."

**Requirement:** the default Tier-2 path must not require the writer to deploy, operate, or pay for any service.

**Resolved** (see [`tech-stack.md`](./tech-stack.md) ADR-5): the default is a **hosted, MIT-licensed Git CMS the writer simply logs into** — nothing to deploy, nothing to pay for, content still committed to their own repository. An **on-domain editor at `/admin`** is the supported alternative for writers or helpers who want the editor on their own site; it costs one one-click serverless deploy today. The MVP generates the configuration for both from `site.config.ts`, so choosing between them is a setup preference, never a fork.

**Explicitly rejected:** building and operating our own auth service. That would make this project a SaaS with accounts, uptime, and liability — a mission non-goal.

## 7. Template architecture

The most important section in this document. This is what makes the system reusable.

### The layers

```
┌─────────────────────────────────────────────────────────────┐
│  CORE ENGINE            versioned · never edited by a writer │
│  content loading · schema validation · routing · URLs ·      │
│  SEO & structured data · feeds · sitemap · search index ·    │
│  image pipeline · pagination · build orchestration           │
└───────────────────────────┬─────────────────────────────────┘
                            │  reads
      ┌─────────────────────┼─────────────────────┐
      ▼                     ▼                     ▼
┌──────────────┐  ┌───────────────────┐  ┌──────────────────┐
│  CONTENT     │  │  SITE CONFIG      │  │  THEME           │
│  content/    │  │  site.config.ts   │  │  layouts ·       │
│  posts ·     │  │  identity · lang  │  │  components ·    │
│  pages ·     │  │  sections · nav   │  │  tokens ·        │
│  images      │  │  theme · host     │  │  UI strings      │
│              │  │  feature flags    │  │                  │
│  the writer  │  │  the writer/helper│  │  swappable       │
└──────────────┘  └───────────────────┘  └──────────────────┘
                            │
                            ▼
                 ┌──────────────────────┐
                 │  GENERATED WEBSITE   │
                 │  static HTML/CSS/img │
                 └──────────────────────┘
```

### The rule

**A writer's site is `content/` + `site.config.ts` + `public/` + a theme choice. Nothing else.**

Creating, customizing, or maintaining a site never requires touching core code. This is enforced, not merely encouraged: CI on the template repository verifies that a site built from only those inputs produces a complete, valid site.

### The theme contract

A theme is a directory. To be valid it must:

1. **Provide a layout for every route the core defines** — home, post, page, section index, tag index, archive, search, 404 — or inherit the default theme's.
2. **Consume only the documented data props** the core passes to each layout. A theme never reads the filesystem, never parses content, and never constructs a URL by hand.
3. **Define the documented design tokens** — colour roles, type scale, font stacks, spacing, radius, measure. Tokens are CSS custom properties so a site can override individual values in config without forking the theme.
4. **Provide UI strings** — every piece of interface text ("Read more", "Published on", "No results"), as a string table. Never hardcoded in a template. This is what makes a non-English site possible without a fork, and is a direct correction of the reference project, where Marathi interface copy is embedded in a dozen components.
5. **Ship at least one preset** (below), and work correctly with any preset a writer selects.

The core owns: what pages exist, what data they get, what URLs they have, and what goes in `<head>`. The theme owns: what they look like.

**Versioned as a public promise.** The contract is documented and semver'd. Breaking it is a major version with a migration note.

### Presets — how a writer's site looks like theirs

"Options for the writer" splits into two layers with very different costs, and the MVP invests in the cheap one first.

**A preset is a named bundle of token values**: a colour palette (light _and_ dark), a font pairing, a type scale, line height, measure, radius, and density. It is a block of CSS custom properties — roughly 50 lines — and it changes how a site _feels_ without changing what any page _is_.

```
Theme  = the reading experience   (layouts, structure, what's on the page)
Preset = the personality          (colour, type, density, mood)
Tokens = individual overrides     (one brand colour, one font swap)
```

**MVP ships one theme and about six presets**, selected in `site.config.ts` with one line, plus the ability to override any individual token on top of a chosen preset.

Requirements for the preset set:

- **Genuinely distinct**, not six shades of grey — they must span warm/cool, serif/sans, dense/airy, light-default/dark-default.
- **Every preset passes the same accessibility bar.** Contrast is checked in CI for both light and dark (`spec.md` §10). A writer cannot pick an inaccessible site.
- **At least one preset is Devanagari-tuned** — font pairing, line height, and letter spacing chosen for the script rather than inherited from an English default. This generalizes the reference project's single best design decision, and it is a real differentiator: almost nothing in this category ships it.
- **Presets are theme-agnostic by construction.** They set tokens the contract defines, so a preset written today keeps working against a theme written later.

**Why one theme and not three.** The theme _contract_ is the reusable asset — the themes are just its first consumers. Building a second and third theme before a real writer has used the first means encoding the same wrong assumptions three times, then maintaining three design systems, three accessibility audits, and three performance budgets. Presets deliver most of the perceived individuality at a fraction of the cost, and the correct moment to build theme #2 is when a real writer wants a different _structure_ — at which point theme #2 also becomes the proof that the contract actually holds. **Planned as a fast-follow, deliberately not MVP.**

**The MVP theme is minimal and text-first**: single column, generous measure, no cover image required, typography doing the work. It is the right default for the poets and essayists this product is aimed at, the cheapest to get genuinely right, and the hardest for a preset to make ugly.

### Reuse mechanics (MVP vs. later)

**MVP: a template repository.** The writer's repo contains the core. They never edit it, so upstream improvements arrive with a `git pull`.

**Deliberately NOT extracting the core into an npm package yet.** That is the correct long-term shape and where this is heading — but a package boundary drawn before two or three real sites exist will be drawn in the wrong place, and the mission forbids designing for hypothetical requirements. The discipline of "never edit core" is what makes the extraction cheap later; adopting the discipline now and the packaging later is the right order. **FUTURE.**

## 8. Configuration vs. customization

The most common change must be the cheapest. This table is the design target and the acceptance criterion:

| The writer wants to change                           | They edit                                             | Requires a developer     |
| ---------------------------------------------------- | ----------------------------------------------------- | ------------------------ |
| A post, a page, an image                             | `content/` (or the browser editor)                    | **No**                   |
| Site title, tagline, author, avatar, social links    | `site.config.ts`                                      | **No**                   |
| Language, locale, text direction                     | `site.config.ts`                                      | **No**                   |
| Sections and their labels                            | `site.config.ts`                                      | **No**                   |
| Navigation order and extra links                     | `site.config.ts`                                      | **No**                   |
| Which theme is used                                  | `site.config.ts`                                      | **No**                   |
| Overall look and mood (one of ~6 presets)            | `site.config.ts`, one line                            | **No**                   |
| Brand colours, fonts, radius, type scale             | `site.config.ts` (token overrides on top of a preset) | **No**                   |
| Feature toggles (search, archive, RSS, reading time) | `site.config.ts`                                      | **No**                   |
| Custom domain / deploy target                        | `site.config.ts` + host settings                      | Once, at setup           |
| Substantially different layout or visual identity    | Fork or author a theme                                | Yes                      |
| New content types, new routes, engine behaviour      | Core (upstream contribution)                          | Yes — and should be rare |

**The anti-pattern this is designed against, stated plainly:** in the reference project, the site's name, base path, repository, brand, and URLs are hardcoded in at least fourteen places across ten files — `index.html`, `seo.ts`, `vite.config.ts`, `404.html`, the CMS config, page components, header and footer. Worse, two of them (`SITE_BASE_PATH` and Vite's `base`) _must be kept identical by hand_, with a source comment saying so. Renaming that site took a dedicated development phase. **In this project, every one of those values has exactly one definition, and everything else derives from it. A hand-sync requirement between two files is treated as a bug.**

## 9. SEO

The writer should never think about SEO. Everything below is generated.

**MVP requirements — all automatic:**

- Unique `<title>` and `<meta name="description">` per page, from content, with sensible fallbacks.
- **Canonical URL on every page** — absolute, derived from one configured site URL.
- **Open Graph and Twitter Card tags on every page**, per page, present in the **served HTML**. This must not depend on JavaScript: social scrapers do not execute it. (The reference project hit exactly this and had to bolt on a post-build HTML-rewriting script to work around a client-rendered architecture. Static generation makes it a non-issue — see ADR-1.)
- **Per-post share image**: the post's cover if set, otherwise the site's default. A shared link must preview as _that post_.
- **`sitemap.xml`**, generated, excluding drafts, linked from `robots.txt`.
- **`robots.txt`**, generated.
- **RSS 2.0 feed** with per-section feeds where sections are configured; auto-discovery `<link>` in `<head>` _and_ a visible link in the UI. Summary feed by default; full-content feed a config option, since the HTML is already being rendered here (unlike the reference project, where it wasn't).
- **Semantic HTML**: one `<h1>` per page, correct heading order, `<article>`, `<time datetime>`, `<nav>`, landmarks.
- **JSON-LD structured data**: `BlogPosting` on posts, `Person` for the author, `WebSite` on the home page. Generated, never authored.
- **`<html lang>` and `dir`** from config — a correctness requirement for non-English sites, not an SEO nicety.
- **Stable URLs.** `/post-slug` style paths, no file extensions, trailing-slash behaviour consistent with the host. An explicit `slug` override lets a writer change a title without breaking an existing link.

**FUTURE / NOT MVP:** generated per-post OG images from the title (removes the "every post needs a picture" burden — attractive, but not required to publish); Atom and JSON Feed alongside RSS; `hreflang`; automatic redirects on slug change.

## 10. Accessibility

**Target: WCAG 2.1 Level AA** for the reader-facing site. Non-negotiable for the default theme and part of the theme contract.

MVP requirements:

- Contrast ≥ 4.5:1 for body text and ≥ 3:1 for large text and UI boundaries. **Theme tokens are contrast-checked in CI** — the default theme cannot regress silently.
- Full keyboard operability with a visible, non-suppressed focus indicator; a skip-to-content link.
- Landmark regions, correct heading hierarchy, and a meaningful document title on every page.
- **Alt text is enforced, not encouraged**: an image with a `cover` and no `coverAlt` fails validation. The browser editor prompts for it at upload. Decorative images use an explicit empty alt.
- Links are descriptive; no bare "click here"; external-link indication where the theme uses one.
- `prefers-reduced-motion` respected by any animation, including carousels.
- **The site works fully with JavaScript disabled.** Reading, navigation, sections, tags, and archive are all server-rendered HTML. Only search and optional enhancements need JS, and their absence is handled gracefully.
- Text reflows to 320px width without horizontal scrolling; layout survives 200% zoom.
- Forms and controls have labels; the search input is a real labelled form that submits without JS.
- Correct `lang` on the document, and on any inline passage in a different language.

## 11. Performance

Static HTML makes these achievable by default rather than by optimization. They are budgets enforced in CI, not aspirations.

| Budget                                                         | Target                                                         |
| -------------------------------------------------------------- | -------------------------------------------------------------- |
| JavaScript shipped on a post page                              | **0 KB** by default; ≤ 20 KB if a theme enhancement is enabled |
| CSS (compressed)                                               | ≤ 20 KB                                                        |
| HTML per page (compressed)                                     | ≤ 30 KB                                                        |
| Total post-page weight excluding images                        | ≤ 60 KB                                                        |
| Largest Contentful Paint (mid-range phone, 4G)                 | < 1.5 s                                                        |
| Cumulative Layout Shift                                        | < 0.05                                                         |
| Lighthouse: Performance / Accessibility / Best Practices / SEO | ≥ 95 each                                                      |
| Full site build, 200 posts                                     | < 30 s                                                         |

**Images.** Uploaded images are optimized at build time: resized to a sensible maximum, compressed, converted to modern formats with fallbacks, given explicit `width`/`height` (eliminating layout shift), `loading="lazy"` below the fold, and responsive `srcset`.

Three lessons from the reference project are requirements here:

1. **The intake path must be fixed, not the images.** A writer uploads a 2 MB phone photo as a thumbnail. Compressing the existing files once solves nothing; the pipeline must catch every future upload automatically, with nothing for the writer to do.
2. **The optimization step must be idempotent.** It runs on every build, including builds that change no images. An earlier version of the reference project's script would have re-compressed its own already-compressed output on every build forever — a lossy pass on a lossy pass. Optimized output goes to a build directory and never overwrites the writer's originals, which makes idempotence structural rather than threshold-dependent.
3. **One image lives in one place.** The reference project shipped ~9 MB of duplicated images across two directories before this was caught.

**No runtime third-party requests.** No CDN fonts by default, no tracking, no embeds, no analytics beacon. A page makes requests to its own origin only.

## 12. Deployment

"Easy to deploy" is a requirement with a definition, not an adjective:

> **The writer never provisions, configures, patches, scales, monitors, or pays for infrastructure. After one-time setup, publishing is a button in a browser, and everything after it is automatic.**

**Setup (once, by the writer or a helper):** copy the template → set `site.config.ts` → push to a Git repository → connect the repository to a static host → authorize the editor. Target: under 30 minutes, fully documented, no local toolchain required for the non-technical path.

**Ongoing (every post, by the writer alone):** publish in `/admin` → commit → CI build → deploy. Target: live within five minutes, zero human steps.

MVP requirements:

- A working CI workflow shipped in the template, building and deploying on push to the default branch.
- **Builds fail loudly and safely.** A build failure leaves the previously deployed site untouched — a broken post never takes the site down. Failures notify the maintainer, not the writer.
- Deterministic, reproducible builds: a lockfile and a pinned runtime version. A build that worked last year works this year.
- A one-command local preview for anyone who wants it, but nothing in the writer's path requires it.
- **A documented uninstall/migration path.** `content/` is the export; leaving is a first-class supported action (Journey E).

**Not in scope:** provisioning servers, containers, orchestration, CDN configuration, or DNS automation.

## 13. Hosting

**Assumption: static file hosting. Nothing else is required.** No Node runtime, no database, no serverless functions in the reader path.

Requirements:

- **Host-agnostic by construction.** The build output is a plain directory of files. Any static host must work: GitHub Pages, Cloudflare Pages, Netlify, Vercel, GitLab Pages, or a rented directory on a shared web host.
- **No single commercial dependency.** Host-specific concerns (base path, trailing slashes, redirects, headers, 404 handling) live in small, swappable adapters — never woven through the core. Changing hosts is a config change and a workflow file, not a migration.
- **The free tier is the design target.** The MVP must be fully functional at zero cost.
- **Custom domains are supported but optional**, and attaching one must not require rebuilding anything but the site.

**Default recommendation: GitHub Pages**, because the repository is already there, it is free, and it requires no additional account. One correction from the reference project: it deployed to a _project subpath_ (`/repo-name/`), and that base path leaked into the build config, SEO constants, an SPA redirect hack, and the generated HTML — the single largest source of coupling in that codebase. **Here, the site URL and base path have exactly one definition, everything derives from it, and root-served is the default assumption.**

## 14. Security

The threat model is small by design, and keeping it small is itself the primary control.

- **No server, no database, no reader accounts, no personal data.** The reader-facing site has essentially no attack surface: it is static files. Whole vulnerability classes — SQL injection, session hijacking, server RCE, credential stuffing — do not apply.
- **Authoring is authenticated by the Git host's own OAuth.** This project never stores, transmits, or validates a password. Access is repository write access, revocable by the writer at any time.
- **No secret is ever committed or shipped to the browser.** The only secret in the system is the OAuth client secret, which lives in the token-exchange service (or is avoided entirely by using a hosted provider).
- **Content is sanitized.** Raw HTML in Markdown is disabled by default; when enabled, it is sanitized against an allowlist. A browser editor writing to a live site is an injection path that must be closed by default.
- **Imported content is untrusted input.** Other platforms' exports are converted to Markdown, never passed through as HTML; scripts, iframes, tracking pixels, and third-party references are stripped, and personal data in exports is never read or written (§18).
- **No third-party JavaScript in the reader's browser**, by default. No ad scripts, no tracking pixels, no social embeds, no hosted fonts. This is the single most effective privacy and security control available, and it is free.
- **Supply chain discipline.** A minimal, deliberately small dependency tree; a committed lockfile; automated dependency updates; CI that builds from a clean checkout. For an open-source project others deploy, a compromised dependency is the realistic attack — not the website.
- **Security headers** (CSP, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`) shipped as host adapter configuration where the host supports them. A strict CSP is achievable precisely because there is no third-party JS.
- **A documented vulnerability-reporting path** (`SECURITY.md`) — table stakes for an open-source project.

## 15. Backup, portability, ownership

This section is a promise to the writer, and it is mostly satisfied by decisions already made.

- **The writer owns the repository.** Not us, not a platform. Under their account, transferable, deletable.
- **Content is plain Markdown and plain image files** in an obvious folder structure. Readable in any text editor, on any OS, forever, with no tooling.
- **Backup is automatic and distributed** — that's what Git is. Every clone is a complete backup with full history. Additionally: `content/` can be copied to a USB stick and it is a complete archive.
- **Migration away is a real, supported path.** The Markdown+frontmatter convention is what Hugo, Jekyll, Eleventy, Astro, and Ghost's importer all read. Moving to another generator is a matter of pointing it at the same folder. **Documented explicitly, not buried** — a project that documents how to leave is one a writer can trust to stay.
- **No proprietary format, no lock-in, no export button**, because nothing was ever locked in.
- **Arriving is as supported as leaving.** An existing WordPress, Blogger, or Substack archive converts into the same plain files (§18), so a writer's ownership covers their whole history.
- **The site outlives the project.** The build output is static files. If this project is abandoned, every deployed site keeps serving indefinitely, and every writer keeps a complete, portable, human-readable copy of their work.

## 16. Analytics

**Decision: no analytics in the MVP. Not built, not bundled, not enabled.**

Reasoning: the mission forbids tracking-heavy monetization and third-party scripts in the reader's browser; a writer publishing their first post does not need a dashboard; and every analytics option adds a third-party request, a privacy question, and usually a cookie banner. The default must be a page that contains the writer's words and nothing else.

**What is provided instead:** a documented, **off-by-default** config slot for a single privacy-respecting, cookieless, GDPR-clean analytics script (self-hosted or hosted). Setting it injects one script tag; leaving it unset — the default — ships nothing. This is ~10 lines of core, costs nothing when unused, and prevents the far worse outcome of a writer pasting an arbitrary tracking snippet into a template.

Never acceptable: bundling an analytics provider, enabling anything by default, collecting data for the project's own benefit, or any cross-site or behavioural tracking.

**FUTURE:** documented guidance on host-provided, server-side analytics (Cloudflare, Netlify) — zero client-side JavaScript and no personal data, which is strictly better than anything client-side.

## 17. Search

**Decision: yes, in the MVP.** Small scope, high value, and the reference project demonstrated it is nearly free when the corpus is small.

MVP behaviour:

- A **build-time JSON index** containing title, excerpt, tags, section, date, and slug for each published post — **not** full bodies. Keeps the index small (a few KB for a typical site) and the implementation trivial.
- **Client-side matching**, loaded only on the search page. Never on a post page, so the zero-JS budget for reading is preserved.
- The search page works **without JavaScript** as a form that submits a query and renders results server-side where the host allows, or degrades to a clear message plus tag and archive browsing.
- **Unicode NFC normalization before comparison.** Directly retained from the reference project and genuinely load-bearing: the same visible character can be stored precomposed or as base + combining mark depending on whether text came from a CMS, a phone keyboard, or a paste — without normalization, a visually identical query silently fails. This affects any writer not using plain ASCII and is invisible until it bites.
- **Empty, no-result, and no-query states all offer a route onward** (popular tags, the archive) rather than dead-ending — a small thing the reference project got right.

**Considered and rejected for MVP:** a hosted search service (third-party dependency, account, and cost, for a corpus of a few hundred documents); full-text body indexing (index size grows without bound for marginal benefit at this scale); fuzzy/stemming libraries (language-specific, and a language-agnostic product cannot pick one).

**FUTURE:** full-body indexing behind a config flag for large archives; optional phonetic/transliteration matching as a pluggable, per-language module — valuable for non-Latin scripts (the reference project's Devanagari→Latin matching let readers without a Marathi keyboard find posts), but too language-specific to be core.

## 18. Content import

**Decision: yes, in the MVP.** A writer with an existing archive is the most common writer this product will meet, and "start from zero" is a reason to stay on a platform. The mission promises that leaving Akshar is easy (Journey E); arriving must be just as honest (Journey F).

**What it is:** a one-way, one-time converter that reads a platform's export file and writes ordinary Akshar content — Markdown with frontmatter, plus local images — into `content/`. It is one command, run by the helper or a developer-writer on their own machine. It is **not** part of the site build, not part of the deployed site, not in `/admin`, and not a service.

```
Platform export file ──▶ importer (local command) ──▶ content/  +  import report
                                                          │
                                  helper reviews the diff and commits
                                                          ▼
                                             normal build & deploy
```

Because it runs once, locally, and emits plain files, it adds no server, no database, no account, and no runtime dependency — every constraint in §20 holds.

### Sources

| Source                               | Export format                              | Status                               |
| ------------------------------------ | ------------------------------------------ | ------------------------------------ |
| **WordPress** (.com and self-hosted) | WXR (XML)                                  | **MVP**                              |
| **Blogger**                          | Blogger backup / Google Takeout (Atom XML) | **MVP**                              |
| **Substack**                         | Export archive (ZIP: CSV + HTML)           | **MVP**                              |
| Medium                               | Export archive (ZIP: HTML)                 | Post-MVP — Phase I-4                 |
| Ghost                                | JSON export (+ images folder)              | Post-MVP — Phase I-4                 |
| Hugo, Jekyll, Eleventy, Astro        | Already Markdown + frontmatter             | No importer — documented manual path |

The MVP three are chosen by where non-technical indie writers actually keep long-lived archives: WordPress and Blogger hold the largest personal archives and remain widely used by regional-language writers; Substack is where newer writers publish. Medium's export is lossy HTML with remote images, and Ghost's audience is already technical — both follow once the pipeline is proven.

### Behaviour

- **An imported post is an ordinary post.** Output conforms exactly to the §4 content model. There are no import-only frontmatter fields, no build-time special cases, and nothing that marks a file as foreign. The content model does not change to accommodate import.
- **Writes only to `content/`**, plus the report. It never edits `site.config.ts`, core, or theme files, and never deletes a file. Where source categories suggest sections, the report prints a ready-to-paste `sections` snippet — the helper decides.
- **Validated by the build's own schema** (ADR-10). An import is not complete until the resulting site builds.
- **Posts map to posts, pages to pages.** Title, original publication date and timezone, slug, tags, excerpt, and body carry across.
- **Categories become tags by default.** An optional mapping file assigns source categories to declared sections; unmapped posts go to the default section.
- **Drafts stay drafts.** Unpublished, private, scheduled, and paid-subscriber-only posts import as `draft: true` and are listed in the report. The writer decides what becomes public, never the importer.
- **Slugs are preserved** from the source so URLs stay recognizable. Non-Latin slugs are percent-decoded and NFC-normalized, never stripped to empty; collisions get a numeric suffix and are reported.
- **HTML becomes Markdown, never raw HTML.** Bodies are converted to CommonMark + GFM. Because raw HTML is disabled by default (§5), anything that cannot be represented — scripts, iframes, forms, inline styles, platform shortcodes, block-editor markup — is dropped, and every drop is reported. Embeds (video, social posts) become a plain link to the original.
- **Nothing third-party survives import.** Tracking pixels, ad markup, share widgets, and remote script references are removed. Remote images are downloaded into the repository and references rewritten; no output file points at the old platform's image host (§11: own-origin requests only).
- **One image lives in one place** (§11). Downloaded images are deduplicated by content hash, and the largest available rendition is fetched. A failed download is reported and the reference is replaced by its alt text, because a missing image fails the build (§4).
- **Cover images require alt text.** A featured image becomes `cover` only when the source provides alt text or a caption. Otherwise the image is still imported, and the report lists the post under "needs cover alt text." Accessibility is enforced (§10); the importer does not invent alt text.
- **Unicode-correct throughout.** All text is NFC-normalized (§17). A Devanagari archive is a required test fixture, not an afterthought.
- **Re-runnable.** Importing the same export twice produces identical output and duplicates nothing. Existing files are skipped unless `--overwrite` is passed. `--dry-run` writes only the report.
- **Single-author.** Multi-author exports import with an `--author` filter; other authors' posts are skipped and reported. Multi-author remains FUTURE (§19).

### Personal data

Platform exports routinely contain data that must never reach a writer's repository — which is frequently public.

- **Subscriber lists are never opened.** Substack's export includes subscriber email files; the importer does not read them. The same applies to member data in any future source.
- **Comments are not imported** (mission non-goal). Commenter names, emails, and IP addresses are never written anywhere.
- **Account metadata is discarded.** Author emails and user records are ignored; only an author's display name is used, and only for `--author` filtering.
- **Enforced by test:** no email address present in any fixture export may appear in any output file or report.

### The import report

A plain-language Markdown file written outside `content/` and never deployed — written for a helper who will explain it to a writer:

- **Counts:** posts, pages, and images imported; items skipped, by reason.
- **Needs attention:** missing cover alt text, failed image downloads, slug collisions, drafts and paid posts held back.
- **Per-post changes:** every dropped embed or unsupported construct.
- **A suggested `sections` snippet** derived from source categories.
- **An old-URL → new-URL map** (CSV) for setting up redirects wherever the old platform or the new host supports them.

### Explicitly not in scope

| Not included                                 | Why                                                                                                                            |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Upload or import screen in `/admin`          | Receiving and processing a file needs a server (§20).                                                                          |
| Import via CI from an uploaded export        | The export would be committed to the writer's often-public repository, and exports contain private drafts and subscriber data. |
| Live API pulls or platform credentials       | Export files are sufficient — no tokens, no rate limits, no third-party API.                                                   |
| Continuous sync, mirroring, or cross-posting | Import is one-way and one-time. Mission non-goal.                                                                              |
| Comments, subscribers, members, likes, stats | Mission non-goals, and personal data.                                                                                          |
| Automatic redirect generation                | FUTURE (§19), shared with slug-change redirects (§9). The URL map is emitted; applying it is manual.                           |

### Acceptance criteria

1. WordPress, Blogger, and Substack fixture exports each import into the example site, which then builds and passes every build-output assertion (ADR-11).
2. No output file contains raw HTML, a script, an iframe, or a reference to a third-party host.
3. No email address from any fixture appears in any output or report.
4. Re-importing the same export produces zero changes.
5. Every item not imported verbatim appears in the report with a reason.
6. Nothing outside `content/` and the report location is created or modified.
7. **Journey F rehearsal:** a real ~200-post archive (helper-supplied, never committed) is imported, reviewed, and deployed by a helper in under 60 minutes.

## 19. Future features — NOT MVP

Recorded so they are not forgotten, and fenced so they do not leak into scope. **Nothing here is a requirement. Nothing here should be designed for in advance.**

**Content & authoring**

- Multi-author support (per-post author, author pages)
- Scheduled publishing (future-dated posts going live automatically)
- Series / multi-part collections
- Post-editing revision UI beyond what Git already provides
- Theme-provided shortcodes (as the safe alternative to MDX)
- Localized translations of the same post

**Reader experience**

- Full-body search; fuzzy and transliteration matching
- Computed related-posts by similarity
- Generated per-post OG images from the title
- Reading progress, table of contents, footnote popovers
- Optional dark mode as a contract-level theme requirement

**Ecosystem & operations**

- **Extracting the core into a versioned npm package** (the intended long-term shape — see §7)
- **Theme #2 (Journal: cover images, card grids, section landings) — planned fast-follow**, and the real test of the theme contract
- Theme #3 (Personal/portfolio: author-forward hero, photo + bio) and a wider theme gallery
- Additional presets contributed by others
- A `create-*` scaffolding CLI for one-command setup
- Medium and Ghost importers (Phase I-4, §21); further import sources only on real writer demand
- Redirect generation from a URL map (covers both slug changes and imported archives)
- Host-provided server-side analytics guidance
- Documented guidance for pairing with an external newsletter service

**LocalLandingCo-specific**

- An intake form that emits a `site.config.ts`
- Automated provisioning of repository, host, and domain for a new writer
- A multi-site management view for an operator running several writer sites

## 20. Non-goals

[`mission.md`](./mission.md) sets the product boundaries: not a social network, not a Medium/Substack clone, not a newsletter platform, not a paywall, not an ad platform, not an enterprise CMS, not multi-author (yet), not a website builder, not a plugin platform, not a hosted SaaS, not a comment system, not a sync or cross-posting tool, not a general-purpose static site generator.

Their technical consequences, stated here so implementation decisions can be checked against them:

- **No database.** Anywhere. If a requirement seems to need one, the requirement is out of scope.
- **No runtime server in the reader path.** The deployed site is static files. A feature that cannot be delivered statically is not an MVP feature.
- **No user accounts, sessions, or passwords** managed by this project.
- **No third-party JavaScript in the reader's browser by default.**
- **No API** — no REST, no GraphQL, no content API. Content is files.
- **No plugin system, no hook API, no middleware chain.** Extension is themes and configuration.
- **No hosted service operated by this project.**
- **No vendor-specific code in the core.** Host differences live in adapters.
- **No speculative abstraction.** Three similar lines beat a premature framework. The core is extracted into a package after real sites prove where the boundary is, not before.
- **No sync with other platforms.** Import is a one-way, one-time local command. Nothing polls, mirrors, or cross-posts, and nothing reads subscriber or member data.

**The scope-creep test, in one question:** _does this let a writer write, manage, publish, or share their work — and can it be delivered as static files with no server?_ Two noes, or one no on the second, means it's out.

## 21. Delivery plan — content import

This plan covers content import only; the core MVP build order is not yet phased in this document. Import depends on two core pieces existing first: **the content schema** (§4, ADR-10) and **the example site used as the CI fixture** (ADR-11). Once those exist, import can proceed in parallel with theme work.

**Phases I-0 to I-3 are MVP. Phase I-4 is post-MVP.**

### Phase I-0 — Import contract

**Goal:** decide exactly what an import produces before converting anything.

- [ ] Define the normalized intermediate record every source adapter emits: kind (post/page), title, date with timezone, slug, HTML body, tags, categories, excerpt, featured image and its alt text, status, author display name, original URL.
- [ ] Specify the mapping from that record to §4 frontmatter, including every fallback and every "report, don't guess" case.
- [ ] Specify the command: `import <source> <export-path>` with `--dry-run`, `--overwrite`, `--author`, and `--section-map`.
- [ ] Specify the report format and the URL-map CSV columns.
- [ ] Record **ADR-13** in `tech-stack.md`: HTML→Markdown converter, HTML sanitizer, XML and ZIP parsing, image fetching — each justified against the dependency strategy (`tech-stack.md` §4).
- [ ] Build synthetic fixture exports for WordPress, Blogger, and Substack covering: a Devanagari archive, a draft, a private/paid post, a cover with no alt text, a broken image URL, an embed, a script tag, a tracking pixel, a comment, a category, and a subscriber file. No real personal data enters the repository.

**Exit:** `docs/import.md` (the contract) reviewed; fixtures committed.

### Phase I-1 — Source-agnostic pipeline

**Goal:** turn intermediate records into valid Akshar content, with every §18 rule implemented once for all sources.

- [ ] HTML → CommonMark + GFM conversion against an allowlist; drop and record everything else; embeds become plain links.
- [ ] Strip scripts, iframes, forms, inline styles, tracking pixels, and share/ad markup.
- [ ] NFC-normalize all text; preserve slugs, percent-decode them, suffix collisions.
- [ ] Image localization: download, prefer the largest rendition, deduplicate by content hash, rewrite references, fall back to alt text on failure.
- [ ] Cover rule: set `cover` only with alt text; otherwise flag in the report.
- [ ] Draft rule: unpublished, private, scheduled, and paid posts become `draft: true` and are flagged.
- [ ] Category → tag mapping, and optional category → section mapping file.
- [ ] File writer: deterministic output, skip unless `--overwrite`, writes only under `content/`, never deletes.
- [ ] Validate output with the build's content schema; plain-language errors; non-zero exit on failure.
- [ ] Report generator, including the suggested `sections` snippet and the URL map.
- [ ] Unit tests (Vitest) for every rule above.

**Exit:** hand-written intermediate records import into the example site, which builds and passes all build-output assertions.

### Phase I-2 — WordPress and Blogger adapters

**Goal:** the two largest sources of long-lived personal archives import cleanly.

- [ ] WordPress WXR adapter: posts, pages, drafts/private/scheduled, categories, tags, excerpts, featured images via attachments; strip block-editor comments; convert or report `[caption]`, `[gallery]`, and `[embed]` shortcodes; ignore comments, users, menus, and attachment pages.
- [ ] Blogger adapter: posts, pages, labels → tags, drafts; fetch full-size image renditions; ignore comments and template/layout entries.
- [ ] Integration tests: each fixture → example site → build → assertions.
- [ ] Manual verification against one real WordPress.com export and one real Blogger export (helper-supplied, kept out of the repository), at least one of them non-Latin.

**Exit:** acceptance criteria 1–6 (§18) hold for WordPress and Blogger.

### Phase I-3 — Substack, guards, docs · import MVP complete

**Goal:** the third source ships, and the safety guarantees are enforced in CI.

- [ ] Substack adapter: posts from the CSV index and HTML files; paid-only posts held as drafts; audio/podcast-only posts reported and skipped; subscriber files never opened.
- [ ] Personal-data guard test across all fixtures (criterion 3).
- [ ] Third-party-reference and raw-HTML guard test across all fixtures (criterion 2).
- [ ] Idempotence test: import twice, assert zero diff (criterion 4).
- [ ] CI: importer unit tests and fixture-import-then-build run in the template repository's workflow.
- [ ] `docs/import.md` for helpers: obtaining each export, running a dry run, reading the report, fixing flagged items, committing, and setting up redirects from the URL map.
- [ ] `AUTHORING.md`: a short plain-language note for writers on what comes across from their old platform and what doesn't (comments, subscribers, stats).
- [ ] Journey F rehearsal with a real ~200-post archive, timed (criterion 7).

**Exit:** all seven §18 acceptance criteria met. Content import ships with the MVP.

### Phase I-4 — Medium and Ghost adapters · post-MVP

**Goal:** extend coverage once the pipeline has been proven on real archives.

- [ ] Medium adapter: posts and drafts from the HTML export; skip "responses" by default; download remote images.
- [ ] Ghost adapter: posts, pages, and tags from the JSON export using its rendered HTML; images from the export folder; ignore members and subscribers.
- [ ] Fixtures for both, run through the same guard, idempotence, and build tests.
- [ ] Extend `docs/import.md`.

**Exit:** acceptance criteria 1–6 hold for Medium and Ghost.
