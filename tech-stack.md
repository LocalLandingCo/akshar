# Akshar — Tech Stack

> **How we build it.**
> Governed by [`spec.md`](./spec.md) (what), which is governed by [`mission.md`](./mission.md) (why).
> Every choice below is justified against those two documents, and — where possible — against evidence from the reference implementation (`D:\projects\MarathiBytes`), which is cited as **[REF]**.
>
> Nothing here is implemented yet. This is the plan of record.

---

## 1. The stack at a glance

| Layer                  | Choice                                                             | One-line reason                                                                                                              |
| ---------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| **Runtime**            | Node.js, active LTS, pinned                                        | Build-time only. Zero runtime in the reader path.                                                                            |
| **Language**           | TypeScript (strict)                                                | Content and theme contracts are typed promises; errors surface at build, not for a reader.                                   |
| **Framework**          | **Astro**                                                          | A static-first content framework that provides, natively, what [REF] hand-built as four scripts and two workarounds.         |
| **Content format**     | Markdown (CommonMark + GFM) + YAML frontmatter                     | Portable, human-readable, universally importable. The export _is_ the source.                                                |
| **Content validation** | Zod schemas via Astro content collections                          | A malformed post fails the build instead of breaking a page.                                                                 |
| **Rendering**          | 100% static generation (SSG)                                       | Every reader-facing guarantee in the spec follows from this.                                                                 |
| **Component model**    | Astro components (`.astro`)                                        | Ship zero JavaScript by default; islands only where genuinely needed.                                                        |
| **Styling**            | Plain modern CSS + custom-property design tokens                   | No build coupling for theme authors; ~20 KB instead of ~47 KB.                                                               |
| **Theme system**       | Token contract + layout override, in-repo · 1 theme + ~6 presets   | Reuse without forking. Presets give individuality cheaply; theme #2 deferred until the contract is proven by real use.       |
| **Authoring**          | Pages CMS (hosted, default) · Sveltia CMS (on-domain, alternative) | Git-based browser editing, proven end-to-end with a real non-technical author **[REF]**. Zero infrastructure for the writer. |
| **Storage**            | Git. No database.                                                  | Version history, backup, and portability for free.                                                                           |
| **Images**             | `astro:assets` (sharp) at build time                               | Fixes the intake path, not the symptom.                                                                                      |
| **Feeds / sitemap**    | `@astrojs/rss`, `@astrojs/sitemap`                                 | Official, maintained, ~10 lines each.                                                                                        |
| **Search**             | Build-time JSON index + client-side match                          | No service, no account, no cost.                                                                                             |
| **Analytics**          | None. Off-by-default config slot only.                             | Mission requirement.                                                                                                         |
| **Testing**            | Vitest (unit) + build-output assertions + Lighthouse CI            | [REF] had no tests. An open-source product others deploy cannot.                                                             |
| **CI/CD**              | GitHub Actions                                                     | Already where the repo is; zero extra accounts.                                                                              |
| **Hosting**            | Any static host. GitHub Pages default.                             | Free, host-agnostic, no lock-in.                                                                                             |
| **Package manager**    | npm                                                                | Ubiquitous, zero install friction for contributors.                                                                          |
| **License**            | MIT                                                                | Maximum freedom to use, fork, and deploy commercially.                                                                       |

---

## 2. Architectural decisions

Trivial choices are not recorded here. These twelve are the ones that shape everything else.

---

### ADR-1 — Static site generation, not a client-rendered SPA

#### Context

The single highest-leverage architectural decision. It determines performance, SEO, accessibility, security, hosting cost, and how much machinery has to be hand-built. **[REF]** is a client-rendered React SPA, and its development history is unusually good evidence for what that costs.

#### Options considered

- **A — Client-rendered SPA** (what [REF] built): React + client-side router, content compiled into the JS bundle.
- **B — Static site generation**: every page rendered to real HTML at build time.
- **C — Server-side rendering**: requires a running server. Immediately disqualified by the mission's "no server to babysit."

#### Decision

**Static site generation.**

#### Reasoning

[REF] shipped a working SPA and then spent multiple development phases rebuilding, by hand, capabilities that SSG provides for free:

| Problem [REF] hit                                                                        | How [REF] solved it                                                                                                    | Under SSG                                 |
| ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| Social scrapers don't execute JS, so every shared link previewed as the generic homepage | A post-build Node script cloning `index.html` and string-replacing meta tags into `dist/public/post/<slug>/index.html` | Real HTML already exists. Non-issue.      |
| Client-side routes 404 on refresh and on deep links                                      | A `404.html` redirect trick with a `pathSegmentsToKeep` counter                                                        | Real files at real paths. Non-issue.      |
| `document.title` never changed across navigation                                         | A `useDocumentMeta` DOM-patching hook on every route                                                                   | `<head>` is rendered per page. Non-issue. |
| RSS needed post data outside the browser                                                 | A second parser path and a shared environment-agnostic module to stop the two from drifting                            | One content layer, one source. Non-issue. |
| Every reader downloads and executes React to read a poem                                 | _(unsolved — inherent to the choice)_                                                                                  | Zero JavaScript.                          |

Every reader-facing guarantee in `spec.md` §9–§14 — share previews present in served HTML, zero-JS reading, LCP under 1.5s, AA accessibility without hydration, a static attack surface, free hosting — is a direct consequence of this decision. Options B and C both produce correct HTML, but only B needs no server.

The content is a few hundred documents that change a few times a week. There is no dynamic data, no personalization, and no logged-in reader. **There is nothing here that requires a runtime.**

#### Trade-offs

**Gained:** zero-JS pages; correct SEO and share previews for free; the smallest possible attack surface; free hosting anywhere; a site that survives the project's abandonment; and roughly four custom build scripts and two workarounds that never need to be written.

**Given up:** every content change requires a rebuild and redeploy — a few minutes' latency between "Publish" and "live." This is a genuine cost and the writer must be told about it in the interface (`spec.md` §3). At the target corpus size it is the only meaningful downside, and it is worth it.

**Watch:** build time grows with post count. Budgeted at under 30s for 200 posts (`spec.md` §11). Incremental builds are a FUTURE concern, not a current one.

---

### ADR-2 — Astro as the framework

#### Context

Given SSG (ADR-1), which generator? This decides the content API, the theme authoring experience, and how much core code we write ourselves.

#### Options considered

- **A — Astro**
- **B — Eleventy (11ty)** — minimal, flexible, JavaScript-based, template-language agnostic.
- **C — Hugo** — extremely fast, single Go binary.
- **D — Next.js / SvelteKit static export** — full app frameworks in static mode.
- **E — Roll our own on Vite** — closest to [REF]'s existing shape.

#### Decision

**Astro.**

#### Reasoning

Astro is a static-first _content_ framework, and this is a content product. It provides natively, and maintains for us, nearly everything §9–§17 of the spec requires:

- **Content collections with Zod schemas** — typed, validated content (ADR-10) with a real API, instead of [REF]'s hand-rolled `parsePosts` + `import.meta.glob` + a parallel `fs.readdirSync` path kept in sync by discipline.
- **Zero JavaScript by default**, with islands available if a theme ever needs interactivity. Directly serves the 0 KB budget.
- **Markdown and frontmatter as a first-class primitive**, not a plugin.
- **`astro:assets`** — build-time image optimization on sharp, with automatic `width`/`height` and responsive output. Replaces [REF]'s bespoke `optimize-images.ts` and its idempotence hazard.
- **Official `@astrojs/rss` and `@astrojs/sitemap`** — replacing hand-written generators.
- **File-based routing with `getStaticPaths`** — sections, tags, pagination, and the archive are routes, not client-side filters.
- **A real layout/slot/component model** — which is what the theme contract (ADR-6) needs to be expressible at all.

Against the alternatives: **Eleventy** is excellent and lighter, but leaves the content schema, the component model, and the asset pipeline to us — the theme contract would need to be invented from scratch. **Hugo** is the fastest and most mature, but Go templates are a significant barrier to the JavaScript-fluent contributors and theme authors this project can realistically attract, and it does not share a language with LocalLandingCo's other work. **Next.js/SvelteKit** are application frameworks; using one for a static blog means carrying a hydration model and a client runtime this product explicitly does not want. **Rolling our own** is exactly what [REF] did, and its history is the argument against repeating it.

Astro is also **TypeScript-native and Vite-based**, so the transferable parts of [REF]'s tooling knowledge carry over directly.

#### Trade-offs

**Gained:** four or five subsystems we would otherwise write and maintain; a maintained content API; a component model good enough to build a theme contract on; a large ecosystem and a hiring/contributor pool.

**Given up:** a framework dependency with its own release cadence and major-version migrations. Mitigated by the fact that content is plain Markdown — if Astro ever became the wrong choice, the writer's content moves to any other generator unchanged (`spec.md` §15). **The framework is replaceable; the content is not. That asymmetry is the whole safety argument.**

**Given up:** `.astro` is a framework-specific component syntax theme authors must learn. It is small, HTML-like, and the cost is judged lower than inventing a template contract ourselves.

---

### ADR-3 — Markdown + YAML frontmatter; not MDX, not structured content, not a database

#### Context

The content format is the most permanent decision in the project. Content outlives every technology choice around it, and `mission.md` promises portability and ownership as non-negotiable.

#### Options considered

- **A — Markdown + YAML frontmatter**
- **B — MDX** (Markdown with embedded components)
- **C — Structured content** (JSON/YAML documents with typed field blocks)
- **D — A database** (SQLite, Postgres, or a headless CMS service)

#### Decision

**Markdown + YAML frontmatter, in Git.** No MDX. No database.

#### Reasoning

Markdown is the only option where **the authoring format, the backup, and the export are the same artifact**. There is no conversion step, no lossy export, and no tooling required to read it in twenty years. It is what Hugo, Jekyll, Eleventy, Astro, and Ghost's importer all consume, which makes migration away a matter of pointing another tool at the same folder — the mission's ownership promise made real (`spec.md` §15).

**MDX is rejected** on four independent grounds, any one of which would be sufficient: it makes content executable code (unportable); it is unreadable and unsafe to edit in a non-technical browser CMS, breaking the primary persona's workflow; it is a code-execution surface in a system where a web editor writes to a live site; and it couples the writer's archive permanently to this toolchain. Theme-provided shortcodes are the correct answer if the need appears — **FUTURE**, and only on evidence.

**Structured content is rejected** because prose is not structured. Forcing a poem or an essay into typed blocks adds authoring friction for a writer while serving a flexibility requirement this product does not have.

**A database is rejected** definitively. The requirements do not justify one: a few hundred documents, one writer, no concurrent editing, no queries beyond "filter and sort," no dynamic reads. A database would add a server, a backup policy, a migration story, a security surface, and a monthly bill — every one of them a mission non-goal. **[REF] is the direct evidence**: it carried Drizzle ORM, a Postgres driver, and a schema with _no database behind it_ for months, and deleting it changed no behaviour at all.

**Retained conventions from [REF], because they were proven:** filename → slug, folder → section, and **a real YAML parser, never a hand-rolled one**. That last is not a style preference — a browser CMS emits multi-line YAML lists that regex-based parsers silently mangle.

#### Trade-offs

**Gained:** permanence, portability, zero lock-in, free version history, human-readable backups, and a well-understood format every writing tool supports.

**Given up:** no arbitrary querying or relational modelling; no concurrent multi-user editing (last write wins — a non-issue for a single-author publication); and structural rigidity depends on schema validation rather than the storage layer, which is why ADR-10 exists.

---

### ADR-4 — Git as the content store and CMS backend

#### Context

The writer needs a browser-based editor (`spec.md` §6, Tier 2). What does that editor write to?

#### Options considered

- **A — Git-based CMS** — a browser UI that commits files to the writer's repository.
- **B — Headless CMS service** (Contentful, Sanity, Strapi Cloud) — content in a vendor's database, pulled at build time.
- **C — Self-hosted CMS with a database** (WordPress, Ghost, Strapi).
- **D — Files only, no browser editor** — Tier 0 alone.

#### Decision

**Git-based CMS.** The editor commits Markdown to the writer's own repository.

#### Reasoning

This is the only option that preserves ownership (ADR-3) while still giving a non-technical writer a browser form. **[REF] proved it end-to-end**: a non-technical author, with her own account and no terminal, published real posts to a live site — repeatedly, without help. That is the strongest empirical result available to this project, and it is why this is chosen rather than reasoned toward.

**A headless CMS service** puts the writer's archive in a vendor's database behind an API key — the exact tenancy problem `mission.md` exists to solve, plus an account, a free-tier ceiling, and a dependency that can change its terms. **A self-hosted CMS** reintroduces the server, database, and patch treadmill the mission rules out. **Files only** would abandon the primary persona entirely.

The structural benefit: **the authoring interface and the developer path write identical files.** There is one content store, no sync, and no possibility of divergence. A writer can edit in `/admin` on Monday and in a text editor on Tuesday.

#### Trade-offs

**Gained:** ownership, free version history and rollback, one content store, no vendor, no database, no cost.

**Given up:** the editor is constrained by what a Git backend can do — no server-side validation, no live collaborative editing, and a rebuild delay before changes are visible. Acceptable for a single-author publication.

**Given up:** it introduces the project's one non-static requirement, which ADR-5 addresses directly.

---

### ADR-5 — Browser-editor authentication must not require writer-operated infrastructure

#### Context

A Git-based CMS running in a browser must exchange an OAuth code for a token, and that exchange needs a client secret, which cannot live in a public page. **This is the only part of the entire system that is not static**, and it sits directly on the mission's core promise.

#### Options considered

- **A — Self-deployed OAuth proxy** (a serverless function the writer or helper deploys) — what **[REF]** built, as a bespoke Cloudflare Worker.
- **B — A hosted, open-source Git-CMS provider** that performs the token exchange as a free service, configured from a file in the writer's repo.
- **C — Host-provided identity** (a host's own Git gateway / identity product).
- **D — We operate an auth service for all writers.**
- **E — Local editor only** (Tier 1) — drop the hosted editor.

#### Decision

**B is the default. A is the documented, fully supported alternative. D is rejected permanently.**

Resolved to two specific products after verifying their current state (September 2026):

|                         | **Default — Pages CMS**                          | **Alternative — Sveltia CMS**                     |
| ----------------------- | ------------------------------------------------ | ------------------------------------------------- |
| Where the editor lives  | `app.pagescms.org` (hosted)                      | `yoursite.com/admin` (in the site)                |
| Writer sets up          | Nothing. Log in with GitHub, authorize the repo. | An OAuth App + a one-click Worker deploy          |
| Config file we generate | `.pages.yml`                                     | `config.yml` (Decap-compatible)                   |
| License / self-hostable | MIT, yes                                         | MIT, n/a (it's a static script)                   |
| Best for                | Every writer, by default                         | On-domain editing; strong mobile + i18n authoring |

The MVP generates **both** config files from `site.config.ts`. They are two YAML declarations of the same content model — one generator, ~100 lines — so supporting both costs almost nothing and neither path is a fork.

**Decap CMS is rejected as the primary runtime.** It is the incumbent (and what [REF] uses), but it is largely stagnant with only occasional releases since the Netlify handover. Sveltia is a ground-up rewrite that reads Decap's config format, so this is a drop-in swap and not a migration.

#### Reasoning

[REF]'s Worker **works**, and it is the right answer for one site. As a _product_ default it is a defect: it means a second vendor account, a second deployment, three secrets to manage, and a piece of infrastructure the writer now owns — which is precisely "a server to babysit," the thing `mission.md` promises to remove. A setup step that requires deploying a serverless function is where a non-technical writer's setup stops.

**B moves that burden off the writer entirely** while keeping content in their repository: the provider authenticates and commits on their behalf, and holds nothing. If it disappears, the writer's content is untouched and they fall back to A or to Tier 1 — so the dependency is on _convenience_, never on _ownership_. That is an acceptable third-party dependency; a content dependency would not be.

**C is attractive where available** and should be supported per-host, but making the default depend on one commercial host's identity product violates `spec.md` §13's no-single-vendor requirement.

**D is rejected permanently**: operating an auth service makes this project a SaaS with accounts, uptime, support, and liability — a `mission.md` non-goal, and the fastest way to stop being something a writer fully owns.

**E is rejected** because it abandons the primary persona.

#### Trade-offs

**Gained:** a setup path with no infrastructure for the writer; the fallback preserved for anyone who wants no third party in the loop; a defensible position against becoming a service.

**Given up:** a dependency on a third-party provider's continued existence for the _convenience_ path. Bounded: it touches authoring convenience only, never content, and both fallbacks are documented and supported.

> **Time-limited constraint worth tracking.** Sveltia's Worker requirement exists only because GitHub does not yet support client-side PKCE for single-page apps — support that was expected and is currently on hold. Sveltia already authenticates **with no backend at all against GitLab**, which uses PKCE today. So: a writer whose repository is on GitLab can have on-domain editing with zero infrastructure right now, and if GitHub ships PKCE, option A's remaining cost disappears entirely and Sveltia becomes the natural default. Design the config generator so switching the default is a one-line change, not a re-architecture.

---

### ADR-6 — Theme system: token contract plus layout override, in-repo for now

#### Context

`spec.md` §7 makes reuse the central architectural requirement: many independent publications from one engine, each visually distinct, none forking core code. How is that boundary drawn, and how is the core distributed?

#### Options considered

**Boundary:**

- **A — Configuration only** (colours and fonts as config values, one fixed layout).
- **B — Design tokens + swappable layouts** over a documented contract.
- **C — A plugin/hook API** letting themes override arbitrary engine behaviour.

**Distribution:**

- **D — Template repository** the writer copies, core included.
- **E — Core as a versioned npm package**, the writer's repo a thin shell.

#### Decision

**B for the boundary. D for distribution now, E as the intended destination — deferred.**

#### Reasoning

**A is too rigid**: `mission.md` explicitly requires that the system be reusable while each publication stays individual. If every site shares one layout, they are visibly the same product, and the helper persona will fork to escape it — which destroys the upgrade path.

**C is rejected outright**: `mission.md` lists "not a plugin platform" as a non-goal. A hook API is a compatibility promise across every future version, and it is the standard way a simple tool becomes a complicated one.

**B draws the line where it actually belongs.** The core owns what is _correct_ — routes, URLs, content loading, SEO, structured data, feeds, the search index, `<head>`. The theme owns what is _taste_ — layout, typography, colour, spacing, and every string of interface text. A theme cannot break SEO, cannot invent a route, and cannot construct a URL by hand, so a bad theme produces an ugly site, never a broken one. Contract details are in `spec.md` §7.

Two specific requirements come straight from [REF]'s failure modes:

- **UI strings are part of the theme contract, never hardcoded in templates.** [REF] has Marathi interface copy embedded across a dozen components, which makes it unusable for any other language without a fork. This single requirement is what makes the product language-agnostic.
- **Design tokens are CSS custom properties**, so `site.config.ts` can override individual values (brand colour, font, radius) without forking the theme. Most "make it look like mine" requests are satisfied by a handful of token overrides.

**Presets are where the customization budget actually goes in the MVP** (`spec.md` §7). A preset is a named block of token values — palette, font pairing, type scale, density — selected with one config line. Six of them cost roughly 300 lines of CSS and deliver most of what a writer means by "make it look like mine"; a second _theme_ costs a full design pass plus its own accessibility audit and performance budget, and would be built against a contract no real writer has exercised yet. **One theme, six presets, theme #2 as a planned fast-follow** — at which point theme #2 is also the test that the contract holds. Because presets set contract-defined tokens, a preset written today keeps working against a theme written later.

**On distribution:** E is the correct long-term shape and where this is going. But a package boundary drawn before two or three real sites exist will be drawn in the wrong place, and `mission.md` forbids designing for hypothetical requirements. **D with strict discipline gets the same upgrade benefit today** — because the writer never edits core, upstream improvements arrive with a `git pull` — and makes the later extraction cheap. Adopting the discipline now and the packaging later is the right order.

#### Trade-offs

**Gained:** visual individuality without forking; a stable contract contributors can write themes against; upgradeability; language independence.

**Given up:** a contract is a promise, and breaking it costs a major version. Deliberate — an unstable contract is worse than none.

**Given up:** under D, core code sits in the writer's repository where it _could_ be edited. Mitigated by convention, documentation, and CI on the template that verifies a site builds correctly from content, config, and theme alone.

---

### ADR-7 — Plain modern CSS with design tokens, not Tailwind

#### Context

[REF] uses Tailwind CSS 3 + shadcn/ui. Carrying that forward is the default-inertia choice, so it deserves examination.

#### Options considered

- **A — Tailwind CSS** (+ a component library) — what [REF] uses.
- **B — Plain modern CSS** with custom properties, nesting, and cascade layers.
- **C — CSS-in-JS / a runtime styling library.**

#### Decision

**Plain modern CSS with a documented design-token layer.** No Tailwind, no component library, in the core or the default theme.

#### Reasoning

A blog theme is roughly a dozen templates and one stylesheet. Tailwind's real value — utility reuse and design consistency across a large application with many developers — does not apply at this scale, and its costs land squarely on this project's goals:

- **It is a build dependency every theme author must install, configure, and understand.** The theme contract (ADR-6) should be learnable by anyone who knows HTML and CSS. Requiring a specific CSS framework narrows the contributor pool for no benefit.
- **The evidence from [REF] is unflattering.** Its CSS bundle was 92 KB, of which nearly half was reachable only from components nothing imported. After pruning it was 47 KB — still more than double this project's 20 KB budget (`spec.md` §11) for what is, visually, a blog.
- **A component library is the wrong shape entirely.** [REF] scaffolded 47 shadcn/ui primitives and used **four** — `badge`, `button`, `card`, `input` — carrying 27 Radix packages and nine other libraries for components no page imported. A reading-focused static site needs almost no interactive primitives.
- **Custom properties are what the token contract needs anyway.** Themes must expose overridable tokens; CSS custom properties do that natively, at runtime, with no build step, which is exactly what lets `site.config.ts` override a brand colour without forking a theme.
- Modern CSS — nesting, `:has()`, cascade layers, container queries, `color-mix()` — covers everything a blog theme needs, with no toolchain.

**C is rejected** on sight: it ships a runtime to the reader, contradicting the 0 KB JavaScript budget.

**What is retained from [REF]:** the _discipline_ of design tokens and a written `design_guidelines.md`, and — importantly — its typographic lesson. Its most valuable design decision was treating the writer's script as a first-class typographic citizen, choosing line height and font pairing for Devanagari rather than inheriting them from an English template. Generalized here: **font stacks, line height, and measure are theme tokens configurable per site**, so this is correct for any script rather than for one.

#### Trade-offs

**Gained:** a theme is HTML and CSS anyone can write; a materially smaller stylesheet; no framework version to migrate; no build coupling in the theme contract.

**Given up:** utility-class velocity for whoever writes the default theme, and manual attention to consistency that a framework would enforce. At the size of one theme, a well-structured token layer is sufficient.

---

### ADR-8 — Search: build-time JSON index, matched client-side

#### Context

`spec.md` §17 puts search in the MVP. Where does the index live and what performs the matching?

#### Options considered

- **A — Full corpus in the bundle, filtered in JS** — [REF]'s approach (viable only because it was already an SPA with all content bundled).
- **B — A build-time JSON index, fetched on the search page.**
- **C — A hosted search service** (Algolia, Pagefind's hosted tier, Typesense).
- **D — No search.**

#### Decision

**B.** A JSON index of title, excerpt, tags, section, date, and slug — not full bodies — generated at build, fetched only on `/search`.

#### Reasoning

**A does not survive ADR-1**: under SSG the corpus is not in a bundle, and putting it there would destroy the zero-JS reading budget. **C adds a third-party account, a crawl step, a runtime request, and a cost ceiling** for a corpus of a few hundred documents — disproportionate, and a vendor dependency `spec.md` §13 warns against. **D abandons a genuinely useful reader capability that costs almost nothing.**

B keeps the index at a few KB for a typical site, loads it on exactly one page so post pages stay at 0 KB, and requires no service, account, or cost. Excluding bodies is what keeps it small; full-body indexing is **FUTURE** behind a flag for large archives.

**Retained from [REF] and genuinely load-bearing: Unicode NFC normalization before comparison.** The same visible character can be stored precomposed or as base + combining mark depending on whether text arrived from a CMS, a phone keyboard, or a paste — without normalization, a visually identical query silently returns nothing. It affects every writer not using plain ASCII, it is invisible until it bites, and it is three lines of code.

**Deliberately not core: phonetic/transliteration matching.** [REF]'s Devanagari→Latin transliteration is clever and solved a real problem (readers without a Marathi keyboard finding posts). It is also inherently language-specific, and a language-agnostic product cannot pick one language's phonetics. **FUTURE**, as a pluggable per-language module.

#### Trade-offs

**Gained:** working search with no service, no account, no cost, and no impact on reading pages.

**Given up:** no stemming, fuzzy matching, or relevance ranking beyond simple field weighting; and titles/excerpts/tags only, so a phrase that appears solely in a body is not found. Proportionate at this scale; revisit only on evidence.

---

### ADR-9 — Host-agnostic static output with thin adapters; GitHub Pages as default

#### Context

`spec.md` §13 requires no dependence on one commercial provider, while `mission.md` requires deployment that a writer never has to think about. Those pull against each other, and [REF] shows what happens when a host's assumptions leak into the code.

#### Options considered

- **A — Commit to one host** and use its features fully.
- **B — Plain static output, with host-specific concerns isolated in small adapters.**
- **C — Abstract over hosts with a deployment plugin layer.**

#### Decision

**B.** The build emits a plain directory. Each supported host gets an adapter: a CI workflow, a config snippet, and documentation. GitHub Pages is the documented default.

#### Reasoning

**A is exactly [REF]'s failure.** It deployed to a GitHub Pages _project subpath_ (`/repo-name/`), and that single fact leaked into the build config, a separate SEO constants module, an SPA redirect script, the generated HTML, and the CMS config. Two of those — `SITE_BASE_PATH` and Vite's `base` — had to be kept identical **by hand**, with a source comment saying so. Renaming that site consumed an entire development phase. **A hand-sync requirement between two files is a bug, and this project treats it as one.**

**C is over-engineering** for what amounts to four small differences between hosts (base path, trailing slashes, redirects, headers). A plugin layer for four config snippets is the speculative abstraction the mission forbids.

B keeps the core host-ignorant. **The site URL and base path have exactly one definition in `site.config.ts`; everything derives from it** — the build's base, canonical URLs, OG URLs, the sitemap, the feed, and the CMS config. Changing hosts is a config value and a workflow file.

GitHub Pages is the default because the repository is already there (the CMS commits to it), it is free, it needs no additional account, and it requires no DNS. **Correcting [REF]:** root-served is the default assumption, with subpath deployment supported as one configured value rather than an ambient assumption.

#### Trade-offs

**Gained:** no lock-in; a free default; host migration as a config change; no host assumption in the core.

**Given up:** host-specific niceties (edge redirects, per-host header configuration, server-side analytics) are not used by default. They remain available through adapters where a writer chooses that host.

---

### ADR-10 — Schema-validated content; a bad post fails the build

#### Context

Content arrives from a browser CMS operated by a non-technical writer. Bad input is expected, not exceptional. Where is it caught?

#### Options considered

- **A — Fail gracefully at render** — defaults and fallbacks, [REF]'s approach (`title` falls back to the slug, `date` to a hardcoded `'2025-01-01'`, thumbnail to a category default).
- **B — Validate against a schema at build time; fail the build with a clear message.**

#### Decision

**B**, via Zod schemas in Astro content collections, with the build's failure isolated so the live site is never affected.

#### Reasoning

Graceful fallbacks hide errors until a reader finds them — and [REF] has a documented live instance of exactly this: the author deleted two images through the CMS's media library while a `defaultThumbnail` constant still pointed at them. Nothing failed, nothing warned, and the next post published without its own image would have rendered a broken image to readers. A silent fallback turned a detectable error into a latent reader-facing defect.

Build-time validation catches it at the only moment when someone can act on it, and `spec.md` §12 already requires that **a failed build leaves the previously deployed site untouched** — so a broken post never takes a site down; it just doesn't go live. That combination makes strictness safe.

It also enforces things no fallback can: `coverAlt` required whenever `cover` is set (`spec.md` §10 — accessibility enforced, not suggested), referenced images must exist, dates must be real dates, slugs must be unique.

#### Trade-offs

**Gained:** errors surface to someone who can fix them; accessibility and referential integrity are structurally guaranteed; the theme receives data it can trust, so templates carry no defensive branching.

**Given up:** a writer can put the site into a state where their newest post doesn't publish until a field is corrected. Mitigated by validating in the CMS form where possible, by writing error messages for a non-technical reader, and by notifying the maintainer rather than the writer on failure.

---

### ADR-11 — The project ships tests

#### Context

[REF]'s own documentation states: _"There is no test suite/framework configured in this repo."_ For a personal site verified by hand in a browser, that is a defensible trade. For an open-source product other people deploy and contribute to, it is not.

#### Decision

Three proportionate layers, no more:

1. **Unit tests (Vitest)** over the pure core logic — frontmatter parsing, slug derivation, excerpt derivation, URL construction, search-index generation, feed and sitemap output, token contrast checks.
2. **Build-output assertions** — build the example site in CI, then assert on the generated files: every post has a canonical URL and an OG image; no page exceeds its weight budget; `sitemap.xml` and `rss.xml` are well-formed and contain every published post and no drafts; drafts are absent; no internal link 404s.
3. **Lighthouse CI** on representative pages, gating the ≥95 scores in `spec.md` §11.

#### Reasoning

The failures that actually hurt this product are not logic bugs — they are _output_ bugs: a missing canonical URL, a draft that shipped, a broken share preview, a page that ballooned past budget, a contrast regression. Layer 2 tests the artifact, which is what readers receive, and it is where most of the value is. Layer 1 protects the small amount of genuinely tricky pure logic. Layer 3 makes the performance and accessibility budgets real rather than aspirational.

Critically, **these tests are also the enforcement mechanism for the theme contract** (ADR-6): a theme that breaks SEO, accessibility, or the weight budget fails CI rather than shipping.

#### Trade-offs

**Gained:** contributors can change things safely; the budgets in `spec.md` are enforced rather than decorative; regressions are caught before a reader sees them.

**Given up:** setup effort and CI time. Bounded by deliberately not testing what doesn't need it — no snapshot tests of markup, no component-level tests for a static theme.

---

### ADR-12 — MIT license

#### Context

`mission.md` makes open source a constraint on design, not just a label.

#### Options considered

MIT · Apache-2.0 · GPL-3.0 · AGPL-3.0

#### Decision

**MIT** for the engine, themes, and documentation. A writer's content is theirs and is not covered by the project's license — stated explicitly in the README and the template repository.

#### Reasoning

MIT imposes the fewest conditions on a writer or an agency deploying a site, which matches "free to use, inspect, fork, and deploy commercially." Copyleft licenses would impose obligations on people whose only act is publishing a blog — disproportionate, and at odds with the promise that a writer who outgrows our help can take it and go. Apache-2.0's patent grant adds little for a static site generator. AGPL's network clause is aimed at a hosted-service model this project explicitly rejects.

#### Trade-offs

**Gained:** maximum adoption and zero legal friction for writers, agencies, and contributors; LocalLandingCo can use it commercially without ambiguity.

**Given up:** someone can fork it into a closed product. Acceptable — the project's value is in the writers served and the machinery produced, not in exclusivity.

---

## 3. Developer tooling

Chosen to be boring, standard, and low-friction for outside contributors.

| Concern               | Choice                                                       | Reason                                                                                                                                                                                                                                                        |
| --------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Package manager**   | npm                                                          | Ships with Node; zero install friction. [REF] used it; no reason to change.                                                                                                                                                                                   |
| **Node version**      | Active LTS, pinned via `.nvmrc` **and** `engines`            | Closes a real [REF] gap — it pinned nothing and simply "developed against Node 24." Reproducible builds are a `spec.md` §12 requirement.                                                                                                                      |
| **Type checking**     | `tsc --noEmit` in CI, strict mode                            | Contracts are typed; violations fail before merge.                                                                                                                                                                                                            |
| **Linting**           | ESLint (flat config) + `eslint-plugin-astro`                 | [REF] had **no linter at all** — fine for one author, not for a project taking PRs.                                                                                                                                                                           |
| **Formatting**        | Prettier + `prettier-plugin-astro`, enforced in CI           | Removes style from code review entirely.                                                                                                                                                                                                                      |
| **Testing**           | Vitest + Lighthouse CI (ADR-11)                              | Shares Vite's config and transform pipeline with Astro.                                                                                                                                                                                                       |
| **Git hooks**         | A single pre-commit hook: format + lint staged files         | Deliberately minimal. Heavy hooks get bypassed.                                                                                                                                                                                                               |
| **Local development** | `astro dev`                                                  | One command, HMR included. **Correcting [REF]:** it ran a custom Express server in middleware mode purely for local dev, along with a Windows-specific `reusePort` workaround and a `cross-env` dependency. The framework's own dev server removes all of it. |
| **Local CMS**         | One npm script starting the CMS against the local filesystem | Tier 1 authoring (`spec.md` §6), no auth, no network.                                                                                                                                                                                                         |
| **Commits**           | Conventional Commits                                         | Enables generated changelogs; helps contributors.                                                                                                                                                                                                             |
| **Editor config**     | `.editorconfig` + recommended-extensions file                | Cross-platform consistency, including Windows/CRLF.                                                                                                                                                                                                           |

**Windows is a first-class development platform.** Development happens on Windows; CI runs on Linux. [REF] hit two real portability bugs — a Linux-only socket option that throws on Windows, and path separators differing between Vite's glob keys and Node's `fs` paths. Both disappear with Astro's own dev server and content layer, but the lesson stands: **never construct a path or a slug by string-splitting on `/`.**

## 4. Open-source infrastructure

What ships in the repository from day one, because an open-source product is a product:

| File                 | Purpose                                                                                                                                                                                                                                         |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `LICENSE`            | MIT (ADR-12).                                                                                                                                                                                                                                   |
| `README.md`          | What it is, who it's for, a 5-minute quickstart, a screenshot, and the non-goals — so people self-select before filing issues.                                                                                                                  |
| `CONTRIBUTING.md`    | Setup, the test/lint commands, PR expectations, and an explicit pointer to `mission.md`'s non-goals.                                                                                                                                            |
| `CODE_OF_CONDUCT.md` | Contributor Covenant.                                                                                                                                                                                                                           |
| `SECURITY.md`        | Vulnerability reporting path (`spec.md` §14).                                                                                                                                                                                                   |
| `CHANGELOG.md`       | Generated from Conventional Commits.                                                                                                                                                                                                            |
| `docs/`              | Setup, configuration reference, the theme contract (the versioned promise from ADR-6), deployment per host, and **the migration-away guide** (`spec.md` §15 — documenting how to leave is how you earn trust).                                  |
| `AUTHORING.md`       | The writer-facing guide, in plain language, no jargon. **Directly retained from [REF]**, which treated it as a shipped deliverable rather than an afterthought — correctly, since a working flow a writer can't navigate is not a working flow. |
| `CLAUDE.md`          | How the code actually works, for AI-assisted development. [REF]'s is unusually good and is the model: it documents _why_ a decision holds and which details are load-bearing, not just what the files are.                                      |
| `.github/workflows/` | CI (lint, typecheck, test, build, Lighthouse) and the deploy workflow shipped in the template.                                                                                                                                                  |
| `examples/`          | A minimal example site used as the integration-test fixture (ADR-11) — which keeps it from going stale.                                                                                                                                         |

**Dependency strategy.** Deliberately minimal and deliberately boring: prefer a framework-official integration over a third-party one, and no dependency at all over either. Every direct dependency must be justifiable in one sentence; the lockfile is committed; automated updates run with CI gating merges. [REF] is the cautionary case — it accumulated over forty packages whose only consumers were components nothing imported, and removing them cut its JavaScript bundle by ~85 KB and its CSS by half.

**Reproducibility.** Pinned Node version, committed lockfile, `npm ci` in CI, no network access at build beyond the registry, and no build step that reaches a third-party API. A build that works today must work in three years.

---

## 5. Open questions for implementation

Everything above is decided. These three genuinely need validation or a decision that is not mine to make.

1. **The default theme's visual design, and the six presets.** The contract is decided (ADR-6) and the preset system is specified (`spec.md` §7) — but the actual typography, palettes, and spacing are not. This sets the product's first impression and becomes the reference every future theme is measured against, so it deserves a deliberate design pass rather than a default. The one firm constraint: at least one preset must be Devanagari-tuned.

2. **Domain and npm namespace for `akshar`.** Availability needs checking before the name is baked into docs, the repository, and published packages. If `akshar` is taken on npm, a scope (`@akshar/*`) resolves it without changing the product name.

_Resolved 2026-09-12:_

- _CMS runtime and auth path (ADR-5) — **Pages CMS** hosted as the default, **Sveltia CMS** on-domain as the supported alternative, Decap rejected as stagnant._
- _Project name — **Akshar** (अक्षर: "letter", and "imperishable")._
- _Theme scope — **one theme plus ~6 presets** in MVP; theme #2 a planned fast-follow._
