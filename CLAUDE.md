# CLAUDE.md

Guidance for AI coding agents (Claude Code and others) working in this
repository. The shared, organization-wide guidance lives only in the `.github`
repository and is imported below; this file adds what is specific to this
repository.

@../.github/CLAUDE.md

If the import above did not load (no `.github` clone next to this repository,
or an agent without `@` imports), read
[.github/CLAUDE.md](https://github.com/RSOcc26/.github/blob/main/CLAUDE.md)
before making changes.

## This repository: `web`

The frontend: the Hub shell (login, company switcher, application navigation),
one UI module per business application and the shared bilingual (sl/en) UI kit.
It is built to static files served by nginx and talks to the backend **only**
through the gateway at `/api/...` on the same origin (no CORS).

The frontend holds no business rules and no secrets; every decision is made by
a service. All user-facing text goes through `src/shared/i18n/` in both
Slovenian and English. Every application module has a manifest
(`docs/app-manifest.md`); no runtime microfrontends or module federation.

Layout: `src/shell/`, `src/apps/<app>/`, `src/shared/{components,api,styles,i18n}/`,
`public/`, `nginx/`, `test/unit/`, `test/e2e/`, `docs/adr/`.
