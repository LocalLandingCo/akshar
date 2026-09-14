# Leaving Akshar

Documenting how to leave is how a project earns the right to be trusted
with your writing (spec.md §15). This is a first-class supported action,
not an afterthought — if anything here is unclear or doesn't work, that's
a bug, please [report it](../SECURITY.md) or file an issue.

## What you actually own

Your entire publication is the `content/` folder: plain Markdown files
with YAML frontmatter, plus the images referenced from them. There is no
database, no export step, and no proprietary format standing between you
and your own words — `content/` _is_ the archive, right now, already.

```
content/
├── posts/
│   └── <section>/
│       ├── my-post.md
│       └── my-post-cover.jpg
└── pages/
    └── about.md
```

Copy that folder to a USB stick, a different repository, or another
computer, and you have a complete, readable, human-editable backup — no
tooling required to read it, today or in twenty years.

## Moving to another static site generator

The Markdown + YAML frontmatter convention is exactly what Hugo, Jekyll,
Eleventy, and Ghost's importer all read. Moving away is pointing another
tool at the same folder, not a conversion:

1. Copy `content/posts/**/*.md` and `content/pages/*.md` into the new
   tool's content directory (adjust the path convention if it differs —
   most use `_posts/` or similar).
2. Frontmatter fields map directly: `title`, `date`, `tags`, `draft`.
   `slug` and `description` are common everywhere too. `cover`/`coverAlt`
   may need renaming to your new tool's image-field convention.
3. `excerpt`, if you never set it explicitly, was always _derived_ from
   the body (see `src/lib/content/posts.ts`'s `deriveExcerpt`) — nothing
   is lost by not carrying it over; the new tool can derive its own, or
   you can compute it once and paste it in.
4. Section folders (`content/posts/essays/`, `.../poems/`) map to
   whatever your new tool calls categories or collections.

## Just want the plain content, no generator at all

`content/` is already that. Every post is readable in any text editor,
every image opens in any image viewer. There's genuinely nothing else to
extract.

## What doesn't come with you (and why that's fine)

- **The theme and presets** (`src/themes/`, `src/presets/`) are
  Akshar-specific rendering code, not your content. They're MIT-licensed,
  so you're welcome to take them as a reference, but no other generator
  reads Astro layout files directly.
- **`site.config.ts`** is a config file, not content. Re-enter your title,
  author info, and section list in whatever the new tool's equivalent is
  — a few minutes of typing, not a migration.
- **The generated CMS configs** (`.pages.yml`, `public/admin/config.yml`)
  are specific to Pages CMS/Sveltia. Most modern static-site CMSs have
  their own equivalent generator or a manual setup path.

## If you're leaving because something's broken

Please say so — [`SECURITY.md`](../SECURITY.md) for a vulnerability,
otherwise an issue on the repository. A project that makes leaving easy
has less to lose by hearing what went wrong.
