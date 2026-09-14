# Setup

For a helper or a technical writer setting a site up for the first time.
Target: under 30 minutes (spec.md §3, Journey A).

## 1. Copy the template

This repository _is_ the template — there's no separate "starter" to find.
Use GitHub's **Use this template** button, or:

```sh
git clone https://github.com/LocalLandingCo/akshar.git my-writer-site
cd my-writer-site
rm -rf .git && git init -b main
```

## 2. Fill in `site.config.ts`

Open [`site.config.ts`](../site.config.ts) at the repo root and replace the
example values: `title`, `tagline`, `description`, `language`, `dir`,
`author`, and `sections`. See [`docs/configuration.md`](./configuration.md)
for every field. The file is validated — a typo or an unknown value fails
`npm run dev` / `npm run build` immediately with a message naming exactly
what's wrong.

## 3. Replace the example content

Delete everything under `content/posts/*/` and `content/pages/` except
`content/pages/about.md` (edit it — every real site needs an About page),
or keep the examples as a reference while you write your first real post.
Content lives in `content/posts/<section>/<file>.md` (one folder per
section you declared in step 2) and `content/pages/<file>.md`.

```sh
npm install
npm run dev
```

Opens at `http://localhost:4321`. Content and config changes hot-reload.

## 4. Generate the authoring config

```sh
npm run cms:generate
```

Writes `.pages.yml` (repo root) and `public/admin/config.yml` from your
`site.config.ts`. Re-run this any time you add or rename a section. Both
files need to be committed — they're not build output.

## 5. Push to a Git repository

```sh
git add -A
git commit -m "chore: set up my site"
git remote add origin <your repo URL>
git push -u origin main
```

## 6. Connect a static host

**Default: GitHub Pages**, because the repo is already there.

1. Repo → **Settings → Pages → Source: GitHub Actions**.
2. Push to `main` — `.github/workflows/deploy.yml` builds and deploys
   automatically. Check the **Actions** tab for progress; the URL is
   `https://<you>.github.io/<repo>/` unless you attach a custom domain.
3. If you're deploying to a **project subpath** (the URL above, not a
   custom domain or a `<you>.github.io` _user_ repo), set `base:
'/<repo>'` in `site.config.ts` before pushing — this is the one value
   that's not root-served by default (spec.md §13).

Any other static host works too — see
[`docs/deployment.md`](./deployment.md) for what changes.

## 7. Authorize the editor

**Default (zero setup):** go to [app.pagescms.org](https://app.pagescms.org),
sign in with GitHub, and authorize the repository. `.pages.yml` (step 4) is
all it needs.

**Alternative (on-domain, at `/<your-site>/admin`):** works immediately for
local editing (see [`AUTHORING.md`](../AUTHORING.md)); the hosted GitHub
sign-in path needs a one-time OAuth setup — see
[`docs/deployment.md`](./deployment.md#on-domain-editor-oauth).

## 8. Hand over

Give the writer three things: the site URL, the editor URL (either
app.pagescms.org or `/admin`), and [`AUTHORING.md`](../AUTHORING.md).
