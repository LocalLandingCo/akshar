# Akshar — Mission

> **Why this project exists.**
> `mission.md` (why) → [`spec.md`](./spec.md) (what) → [`tech-stack.md`](./tech-stack.md) (how).
> When a proposed change doesn't trace back to something in this document, that is worth pausing on before building it.

---

## The name

**Akshar** — अक्षर.

In Marathi and Sanskrit it means _letter_ or _syllable_: the smallest unit of written language, the thing a writer actually works in. The same word also means _imperishable_ — that which does not decay.

Both meanings are the product. Akshar takes a writer's letters and makes them permanent: plain files the writer owns, on a site that costs nothing to keep running, in a form that outlives the software that made it.

## Mission

**Give an independent writer a real, permanent, self-owned home on the web — and let them get back to writing within an hour.**

The writer should be able to write, publish, and share their work without learning web development, without renting a server, without a monthly bill that scales with their readership, and without handing their archive to a platform that can change its terms, its algorithm, or its existence.

## Vision

A writer with no technical background can start a publication that:

- **Costs nothing to run** and stays that way at any traffic level a writer realistically reaches.
- **Belongs to them completely** — every post is a plain file in their own repository, readable and movable without this project.
- **Looks like theirs, not like ours** — the same engine powers many publications without making them look alike.
- **Outlives this project.** If development stops tomorrow, every existing site keeps serving, and every writer keeps a complete, portable copy of their work.
- **Welcomes the writing they already have.** Years of posts on WordPress, Blogger, or Substack come along, converted into the same plain files — ownership starts with the whole archive, not just the next post.

And a second writer can be set up from the same foundation in an afternoon — not by copying and rewriting a codebase, but by supplying content and configuration to a system that was designed to be supplied.

## Problem

Indie writers publishing online today choose between two bad options.

**Hosted platforms (Medium, Substack, WordPress.com).** Publishing is easy and the infrastructure is invisible — but the writer is a tenant. The platform owns the URL, the reader relationship, and the presentation. It can insert advertising, paywalls, upsells, or recommendation feeds into the writer's work. Pricing changes. Terms change. Export, where it exists, is lossy. The writer's archive is a liability held by someone else.

**Self-hosting (WordPress, Ghost, a hand-rolled site).** The writer owns everything — and inherits a server, a database, a backup policy, a security update treadmill, a monthly bill, and a class of failure they are not equipped to diagnose. Static site generators remove the server but replace it with a terminal, a git workflow, and a build pipeline. For a writer who is not a developer, "just run `hugo new post`" is not a publishing workflow.

**The gap is the whole product.** Nothing in the middle offers platform-grade ease of publishing on top of self-owned, portable, zero-cost, zero-server infrastructure. That middle is what this project is for.

Three secondary problems are just as real and less often addressed:

- **Non-English and non-Latin writing is a second-class citizen.** Most templates are built for English, and everything from line height and font pairing to word counting, search matching, and URL slugs quietly misbehaves for other scripts. A writer should not have to fight the software to be legible in their own language.
- **Setup effort is paid per site, not once.** Every new writer site is treated as a fresh project. It shouldn't be.
- **Existing archives are trapped.** Most writers who want to own their work already have years of it somewhere else. Platform exports are lossy dumps of HTML and platform markup that nothing reads cleanly, so "start fresh" becomes the reason to stay a tenant. Leaving a platform should not cost a writer their history.

## Target audience

**Primary: the indie writer.** Someone who writes — poetry, essays, fiction, criticism, technical notes, a newsletter-style column — and wants it online under their own name. They are comfortable with a web form and a text editor. They are not comfortable with, and should never be required to touch, a terminal, git, DNS, a server, or a build pipeline. They are publishing dozens to hundreds of pieces over years, not millions.

**Secondary: the technical helper.** A developer, or a service like LocalLandingCo, who sets a site up _for_ a writer and then steps back. Their measure of success is that they never need to come back. This audience is why the system must be genuinely configurable rather than a codebase to be forked and edited.

**Also served: the developer-writer.** Someone who would happily edit Markdown in their own editor and push to git, and who wants a good static blog without assembling one. They should be first-class, but they are not who the hard design decisions are made for.

**Explicitly not the audience:** editorial teams with roles and approval workflows, businesses running content marketing, publications that need a paywall or a subscriber database, and anyone whose requirements start with "we need an API."

## Product philosophy

**Simplicity is the feature.** Every capability has an ongoing cost in things that can break and things a writer might have to understand. A feature must earn its place against that cost, not merely be useful. The reference implementation for this project spent an entire development phase deleting scaffolding it never used — the lesson is to not add it in the first place.

**Ownership is not negotiable.** Content lives as plain Markdown files in a repository the writer controls. The complete site can be rebuilt, or abandoned and migrated elsewhere, without this project's cooperation. There is no proprietary format, no export step, and nothing held hostage.

**Open source, permissively licensed.** The engine is free to use, inspect, fork, and deploy commercially. A writer who outgrows our help can take it and go. This is a constraint on design, not just a license choice: it rules out anything that depends on a private service we operate.

**No advertising. Ever.** No ad networks, no ad slots, no sponsored-content plumbing, no behavioural tracking, no third-party scripts running in a reader's browser by default. This is a permanent, architectural commitment, not a default setting. A reader page should be the writer's words and nothing else. Monetization, if a writer wants it, is theirs to arrange — the project will not build the machinery for it.

**Content-first.** Design serves reading. Pages are fast, legible, typographically careful, accessible, and work without JavaScript. Typography is treated as a first-class concern for the writer's actual script, not defaulted from an English template.

**Easy deployment is a core requirement, not a nice-to-have.** "Easy" means: no server to provision, no database to back up, no runtime to keep patched, no credentials to rotate, and no bill. Publishing a post is one action in a browser; everything after that is automatic.

**Reusability is the architecture.** One engine, many publications. A writer's site is content plus configuration plus a theme — never a modified copy of the core. If making a site for a new writer requires editing core code, the design has failed.

**Low operational burden — for the writer and for the maintainer.** A site should need zero attention between posts. A writer who stops publishing for two years should find their site still up and still working when they come back.

**Honest about what it isn't.** The project would rather do a small thing completely than a large thing partially.

## Relationship to LocalLandingCo

LocalLandingCo's operating principle is:

> **Standardize as much as possible. Customize only where the customer perceives value. Automate everything repetitive.**

This project is the first concrete instance of that principle, and its first real test.

The agency's economics depend on never building the same thing twice. A one-person agency that builds custom websites is a freelancer with extra steps; a one-person agency that runs a _system_ is a business. This project is where that system gets built for the first time, in a domain small enough to actually finish.

What LocalLandingCo gets out of it:

- **A reusable production asset.** Setting up a writer's publication — including bringing over their existing archive — becomes a repeatable, mostly-automated pipeline rather than a project.
- **A proving ground for the layered architecture** — core engine / content / configuration / theme — that the agency's landing-page product will need in a more demanding form. The separation is easier to get right here, where the content model is simple and the requirements are known, than on a customer deadline.
- **Credibility.** An open-source project that real writers use is a better introduction to a prospective customer than a portfolio of one-off sites.
- **Reusable sub-assets**: the deployment pattern, the CI workflow, the SEO/metadata generation, the theme-token contract, and the "hand a non-technical person a browser-based editor" pattern all transfer directly to the landing-page product.

What it is _not_: a revenue line. This project's success is measured in writers served and in reusable machinery produced, not in money. It is deliberately open source and free, and the agency's value sits in doing the setup, the customization, and the ongoing care — not in owning the tool.

## Why this is different from the reference project

This project's direct ancestor is **प्राजक्तप्रभा** (`D:\projects\MarathiBytes`), a Marathi creative-writing site built for one author. It works, it is live, and a non-technical author genuinely publishes to it from a browser with no help. That is a real, proven result, and it is the reason this project starts from evidence rather than from speculation.

But it is a _personal site_, and it differs from this project in kind, not just in degree:

|                        | प्राजक्तप्रभा (reference)                                                         | Akshar                                                                  |
| ---------------------- | --------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| **Serves**             | One named author                                                                  | Any indie writer                                                        |
| **Content model**      | Three fixed categories shaped around what she writes (poetry / articles / ukhane) | Writer-declared sections, with a sensible default                       |
| **Identity**           | Name, brand, portrait, colours, Marathi UI copy hardcoded across a dozen files    | One configuration file                                                  |
| **Language**           | Marathi/Devanagari throughout, by design                                          | Script-agnostic core; language is configuration                         |
| **Design**             | One design, edited in place                                                       | Swappable themes over a stable contract                                 |
| **Reuse story**        | None intended — a second site means forking and find-and-replace                  | The entire point                                                        |
| **Audience for docs**  | The author, and whoever maintains it for her                                      | Every writer, and every contributor                                     |
| **Stability contract** | None — anything can be changed at any time                                        | Public project: content format, config, and theme contract are promises |

Its explicit non-goals said _"not a general CMS product"_ and _"the content model should stay opinionated to what she writes."_ Respecting that is exactly why this is a new project and not a refactor of that one. Her site stays hers; what transfers is knowledge, not code.

Crucially, **the reference project's own history is the strongest evidence available for what to build here.** It started from a generic full-stack scaffold and spent years of small decisions discovering which parts were load-bearing. Its documented failures — a client-rendered app that share-preview scrapers couldn't read, a database layer with no database, forty-three UI components nobody imported, a category list duplicated in six places, multi-megabyte phone photos served to readers, an image-compression step that would have re-compressed its own output forever — are worth more than its successes. This project is designed to make those specific mistakes structurally impossible.

## Non-goals

These are boundaries, not a backlog. Each one is something a reasonable person will ask for; each one is being declined on purpose.

**Not a social network.** No follows, feeds, likes, profiles, or reader accounts. A reader's relationship is with the writer, through RSS, a link, or email — not through us.

**Not a Medium or Substack clone.** No cross-publication discovery, no recommendation engine, no reader graph, no network effects. A writer's site is a destination, not a node in our network.

**Not a newsletter platform.** No subscriber lists, no email sending, no delivery infrastructure. Those need a server, a database, personal data, deliverability expertise, and a compliance posture — the exact operational burden this project exists to avoid. A writer who wants email should point readers at a service that does it well.

**Not a paywall or membership system.** Gating content requires authenticated readers and server-side enforcement, which is incompatible with static hosting and with the ownership model.

**Not an advertising platform.** Covered above. Permanent.

**Not an enterprise CMS.** No roles, permissions, editorial workflows, approval chains, content staging environments, or audit trails.

**Not multi-author (for now).** A publication has one voice in the MVP. Multi-author is a genuine future possibility and is designed _around_ — it is not designed _for_, and nothing should be built speculatively to accommodate it.

**Not a website builder.** No drag-and-drop page composition, no visual layout editor, no arbitrary page types. This builds blogs. A writer who needs a shop, a booking system, or a landing page needs different software — possibly another LocalLandingCo product.

**Not a plugin platform.** A plugin API is a compatibility promise across every future version and the usual way a simple tool becomes a complicated one. Extension happens through themes and configuration, within a contract we control.

**Not a hosted SaaS.** The project operates no service, holds no writer data, and has no account system. The moment it does, it inherits uptime, support, billing, and liability — and stops being something a writer fully owns.

**Not a comment system.** Comments need a server, moderation, spam defence, and personal-data handling. Out of scope; a writer can link to a discussion elsewhere.

**Not a sync or cross-posting tool.** Content import is one-way and one-time: an export file goes in, plain files come out, and the old platform is never contacted again. No mirroring, no scheduled pulls, no publishing back out to other platforms, and no importing of subscribers, comments, or stats.

**Not a general-purpose static site generator.** This is a blog engine with opinions. Where a choice exists between "flexible" and "correct for writers," it picks correct for writers.
