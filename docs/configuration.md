# Configuration reference

`site.config.ts` at the repo root is the single source of truth for
everything spec.md §8 says must be a config change, never a core edit.
It's validated (`src/lib/site-config.schema.ts`) — an invalid value fails
the build with a message naming the exact field and why.

```ts
import { defineSiteConfig } from './src/lib/site-config.schema';

export default defineSiteConfig({
  // ...
});
```

## Identity

| Field         | Required | Notes                                                                                                                                                          |
| ------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `url`         | yes      | Absolute site URL, no trailing slash. Everything else — canonical URLs, OG tags, the sitemap, the feed, the CMS config — derives from this and `base` (ADR-9). |
| `base`        | no       | Sub-path deployment, e.g. `/my-site`. Empty (root-served) is the default and the recommended choice — see `docs/deployment.md`.                                |
| `title`       | yes      |                                                                                                                                                                |
| `tagline`     | no       | Shown on the home page.                                                                                                                                        |
| `description` | yes      | Default meta description and OG description.                                                                                                                   |
| `ogImage`     | no       | Default share image (a `public/`-relative path, e.g. `/og-default.jpg`), used when a post has no cover of its own.                                             |
| `language`    | yes      | A BCP-47 tag (`en`, `mr`, `hi`…). Drives `<html lang>` — a correctness requirement, not cosmetic.                                                              |
| `dir`         | no       | `'ltr'` (default) or `'rtl'`.                                                                                                                                  |
| `repository`  | no       | `"owner/repo"`. Only used by the generated Decap/Sveltia config (`npm run cms:generate`) — Pages CMS doesn't need it.                                          |

## Author

```ts
author: {
  name: 'Your Name',
  bio: 'A line or two.',        // optional
  avatar: '/avatar.jpg',         // optional, public/-relative
  links: [                        // optional
    { label: 'Email', url: 'mailto:you@example.com' },
  ],
},
```

Feeds the byline, the `Person` structured-data block, and (if you add an
About page that references it) your bio. Single-author only in the MVP —
see mission.md's non-goals.

## Sections

```ts
sections: [
  { id: 'essays', label: 'Essays', description: 'Long-form writing.' },
  { id: 'poems', label: 'Poems' },
],
```

One entry per content folder under `content/posts/`. `id` is the URL
segment and the folder name (lowercase, digits, hyphens only — and can't
collide with the reserved words `tags`, `archive`, `search`). Omit
`sections` entirely and you get a single default section, `posts` — a
writer who never thinks about sections never has to.

## Navigation

Derived by default: Home, one entry per section, one per page, then
Archive and Search if enabled. Override with an explicit list:

```ts
navigation: [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about/' },
  { label: 'Elsewhere', href: 'https://example.com' }, // external links work
],
```

## Theme

```ts
theme: {
  name: 'default',          // the only theme in the MVP
  preset: 'kagad',           // one of the six — see docs/theme-contract.md
  tokens: {                    // optional: override individual tokens on top of the preset
    'color-accent': '#2e7d5b',
  },
},
```

`preset` is validated against the actual files in `src/presets/` — an
unknown id fails the build and lists the valid ones. `tokens` keys are
CSS custom property names _without_ the `--` prefix; see
`docs/theme-contract.md` for the full token list.

## Feature toggles

```ts
features: {
  search: true,        // the /search page and its JSON index
  archive: true,         // the /archive page
  rss: true,               // /rss.xml and /<section>/rss.xml
  rssFullContent: false,     // full post HTML in the feed vs. a summary
  readingTime: true,           // "N min read" on posts
},
```

All default to the values shown. `rss: false` removes the feeds and the
`<link rel="alternate">` auto-discovery tag, not just the nav entry.

## Analytics

Off by default, and stays that way unless you explicitly configure it
(spec.md §16 — this is a permanent mission commitment, not a preference):

```ts
analytics: {
  enabled: true,
  src: 'https://your-privacy-respecting-provider.example/script.js',
  attributes: { 'data-website-id': '...' }, // whatever your provider needs
},
```

Omit `analytics` entirely for the default: no third-party script, no
tracking, nothing.
