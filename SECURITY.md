# Security Policy

## Reporting a vulnerability

Please **do not** open a public issue for a security vulnerability.

Use GitHub's private reporting instead: go to the **Security** tab of this
repository → **Report a vulnerability**. This opens a private advisory
visible only to you and the maintainers, and is the fastest way to get a
response.

If you can't use that for some reason, open a regular issue asking a
maintainer to contact you privately, without describing the vulnerability
itself.

We'll acknowledge a report within a few days and aim to have a fix or a
mitigation plan within 30 days, depending on severity. We'll credit you in
the advisory and release notes unless you'd rather stay anonymous.

## Scope

Akshar's actual attack surface is deliberately small (spec.md §14): the
deployed site is static files, with no server, no database, and no reader
accounts. The realistic risks are:

- A dependency vulnerability that reaches the build (supply chain — the
  thing this project's minimal dependency tree is a defense against).
- Content sanitization: a way for imported or Markdown-authored content to
  produce a script/injection in the rendered output.
- The generated CMS configs (`.pages.yml`, `public/admin/config.yml`) or
  the authoring flow exposing more than a writer's own repository access.

If you're not sure whether something is a security issue or just a bug,
report it privately anyway — better a false positive than a missed report.

## Supported versions

This project hasn't shipped a first tagged release yet. Once it does, only
the latest minor release line is supported with security fixes; older
releases won't receive backports.
