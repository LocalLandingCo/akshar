# Contributing to Akshar

Thanks for considering it. Before filing an issue or opening a PR, please
read [`mission.md`](./mission.md) — specifically its **Non-goals** section.
This project turns down a long list of reasonable-sounding features on
purpose (comments, multi-author, a paywall, a plugin API, analytics-by-
default…), and a PR that adds one of them will be closed regardless of
quality. If your idea isn't in that list and you're unsure whether it fits,
open an issue first rather than a PR — it saves everyone time.

## Setup

```sh
git clone <your fork>
cd akshar
npm install    # also wires up the pre-commit hook
npm run dev
```

Node version is pinned in [`.nvmrc`](./.nvmrc); use it (`nvm use`, or
whatever your version manager calls it) — a build should behave identically
today and in three years (spec.md §12).

## Before you open a PR

```sh
npm run format:check   # prettier
npm run lint            # eslint
npm run typecheck        # astro check
npm run test               # vitest, unit tests
npm run build                # typecheck + production build
npm run test:build-output      # build-output assertions (ADR-11 layer 2) — builds first
npm run lhci                     # Lighthouse CI (ADR-11 layer 3) — needs a local Chrome
```

`npm run build` and `test:build-output` both build the site, so running
`test:build-output` alone after a code change is usually enough locally;
CI runs the full sequence regardless. The pre-commit hook formats and lints
staged files automatically — don't fight it, and don't bypass it without a
reason you'd defend in review.

If you touched the default theme (`src/themes/default/`) or a preset
(`src/presets/`), also run `npm run lhci` locally — CI runs it too, but
catching a score regression before pushing is faster.

## Commit messages

[Conventional Commits](https://www.conventionalcommits.org/) — `feat:`,
`fix:`, `docs:`, `refactor:`, `test:`, `chore:`, with an optional scope
(`feat(search): …`). This is what `CHANGELOG.md` is generated from.

## What a good PR looks like

- **Small and focused.** One change, one reason. A PR that fixes a bug and
  reformats an unrelated file makes both harder to review.
- **Tested at the right layer.** Pure logic gets a unit test
  (`src/**/*.test.ts`); a change to routing, SEO output, or a budget gets a
  build-output assertion (`tests/build-output.test.ts`) if the existing
  ones don't already cover it.
- **Traces back to something written down.** If a change doesn't trace to
  `mission.md`, `spec.md`, or a filed issue, say in the PR description why
  it's needed anyway — "seemed useful" isn't a reason this project accepts
  (mission.md's "Product philosophy": _"A feature must earn its place... not
  merely be useful."_).

## Theme and preset contributions

The theme contract (`docs/theme-contract.md`) is a versioned promise —
changing what a layout receives or requires is a breaking change and needs
a maintainer's sign-off before you write the code, not after. A new
**preset** (a token file under `src/presets/`) is a much smaller ask: it
must pass `src/presets/presets.test.ts`'s accessibility checks (4.5:1 body
text, 3:1 UI boundaries, both light and dark where it has both) and be
genuinely distinct from the existing set, not a hue shift.

## Architecture questions

[`tech-stack.md`](./tech-stack.md) records _why_ the codebase looks the way
it does, as a set of ADRs with the alternatives that were rejected and why.
If you're about to argue for a database, an API, a plugin system, or
Tailwind, it's almost certainly already been weighed there — read the
relevant ADR first. [`CLAUDE.md`](./CLAUDE.md) is the "how it actually
works" companion, for the load-bearing implementation details that aren't
obvious from the file layout.

## Reporting bugs

Include: what you expected, what happened, your Node version, and — if it's
a build or content issue — the smallest `site.config.ts` / content fixture
that reproduces it. "Import doesn't work" without a source export attached
isn't actionable; see `docs/import.md` once the import phases land.

## Security

Don't open a public issue for a vulnerability — see
[`SECURITY.md`](./SECURITY.md).
