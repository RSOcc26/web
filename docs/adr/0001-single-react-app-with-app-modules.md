# 1. One React application with application modules

- **Status:** Accepted
- **Date:** 2026-10-23

## Context

CompanyCentral has a Hub shell and several business applications. Runtime
microfrontends (module federation, single-spa) allow applications to be deployed
separately. They also add a second build and deployment model, version
negotiation between shared libraries, and harder debugging. For a two-person
team that is a lot of work for little gain.

## Decision

- `web` is **one React application**, built to static files and served by
  nginx. The Hub shell and all application modules are built and deployed
  together.
- Each business application is a module in `src/apps/<app-id>/` that exports a
  **manifest** ([app-manifest.md](../app-manifest.md)). The shell builds its
  navigation and routes from the manifests, filtered by the applications the
  company has enabled and the user's permissions (from Access).
- Modules use only the shared UI kit, the shared API clients and the shared
  i18n (Slovenian and English). They never import from another module.
- All backend calls go through the gateway on the same origin (`/api/...`).

## Consequences

- One pipeline and one image for the whole UI.
- Modules can later be split into separate bundles or microfrontends, because
  their boundary (manifest, no cross-module imports) is already explicit.
- Releasing one application means releasing the whole frontend, which is
  acceptable at our scale.
