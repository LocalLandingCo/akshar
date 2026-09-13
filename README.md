# Akshar — अक्षर

An open-source blog engine that turns a folder of Markdown files and one configuration file into a
fast, accessible, self-owned static website — with a browser-based editor so a non-technical writer
never has to see a terminal.

Read **[`mission.md`](./mission.md)** (why this exists), **[`spec.md`](./spec.md)** (what it does),
and **[`tech-stack.md`](./tech-stack.md)** (how it's built) before contributing — every decision in
the codebase traces back to one of those three documents.

**Status: pre-release, under active development.** There is no template repository or example site
to copy yet. This README will carry a real quickstart once one exists.

## Development

```sh
npm install
npm run dev        # local dev server
npm run typecheck   # astro check
npm run lint         # eslint
npm run format:check # prettier --check
npm run test          # vitest
npm run build          # typecheck + production build
```

Node version is pinned in `.nvmrc`. `npm install` also wires up a pre-commit hook
(`.githooks/pre-commit`) that formats and lints staged files.

## License

MIT for the engine, themes, and documentation (see [`LICENSE`](./LICENSE)). A writer's own content is
theirs and is not covered by this license.
