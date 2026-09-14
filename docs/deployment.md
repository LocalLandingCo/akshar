# Deployment

The build output (`dist/`, from `npm run build`) is a plain directory of
static files. Any static host works — the four differences that ever
matter between hosts are base path, trailing slashes, redirects, and
headers, and all four are either a `site.config.ts` value or a workflow
file, never core code (spec.md §13, ADR-9).

## GitHub Pages (default)

Already wired: `.github/workflows/deploy.yml` builds and deploys on every
push to `main`, using GitHub's official `actions/deploy-pages` (no
personal access token, no `gh-pages` branch).

One-time setup: repo **Settings → Pages → Source: GitHub Actions**. That's
it — the workflow handles the rest.

**Base path.** A _user_ site (`<you>.github.io`) or a **custom domain**
serves from the root — leave `base` unset in `site.config.ts`. A _project_
site (`<you>.github.io/<repo>/`) needs `base: '/<repo>'`. This is the one
value the reference project hardcoded in a dozen places by accident
(tech-stack.md ADR-9); here it's the one line you set.

**Custom domain.** Add a `public/CNAME` file containing your domain, one
line, no protocol (`blog.example.com`). Astro copies `public/` verbatim,
so this needs no code. Set the DNS record your registrar/host requires,
then also set `base` back to empty and `url` in `site.config.ts` to the
custom domain.

**`.nojekyll`.** Already in `public/` — without it, GitHub Pages' default
Jekyll processing silently drops any folder starting with `_`, which is
exactly what Astro's asset output (`_astro/`) is named. If you ever see
every page's CSS and images 404 on a fresh GitHub Pages deploy, this file
going missing is the first thing to check.

## Other hosts

The build is identical regardless of host — only the _deploy step_ differs.

**Cloudflare Pages / Netlify / Vercel:** connect the repo through their
dashboard; build command `npm run build`, output directory `dist`. They
each auto-detect Astro. Root-served by default — leave `base` unset.

**GitLab Pages:** a `.gitlab-ci.yml` running `npm ci && npm run build` and
publishing `dist/` as the `public:` artifact. Same base-path rule as
GitHub Pages if deploying to a project subpath.

**A rented directory on a shared host:** `npm run build` locally or in any
CI, then upload `dist/`'s contents via SFTP/rsync. No Node runtime needed
on the server — it's just files.

To switch hosts later: change `site.config.ts`'s `url`/`base` if the new
host serves from a different path, swap the deploy step, done. Nothing
else in the codebase knows which host it's on.

## On-domain editor OAuth

The default authoring path (Pages CMS, `docs/setup.md` step 7) needs zero
infrastructure. The **on-domain** alternative — Sveltia CMS at
`/admin`, signing in with GitHub directly against your own repo — needs
one thing the hosted path doesn't: a token-exchange service, because a
browser page can't hold an OAuth client secret.

This is the **only non-static part of the entire system**
(tech-stack.md ADR-5). Two ways to get it:

1. **Deploy the reference OAuth Worker.** Sveltia CMS's docs link a
   one-click Cloudflare Worker template for exactly this. Free tier is
   sufficient. Point Sveltia's `backend` at it per their docs.
2. **Use a GitLab repository instead of GitHub.** Sveltia authenticates
   against GitLab with no backend at all (GitLab supports PKCE today;
   GitHub doesn't yet). If your content repo can live on GitLab, this
   removes the Worker entirely.

Local editing (`npm run cms`, i.e. Tier 1) needs neither of these — it
never leaves your machine.

## Reproducibility

`package-lock.json` is committed; CI runs `npm ci`, never `npm install`.
`.nvmrc` pins the Node version `actions/setup-node` reads. No build step
makes a network request beyond the npm registry. A build that passes
today should behave identically in three years.
