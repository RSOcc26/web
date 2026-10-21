# web

CompanyHub web frontend: the Hub shell and the user interface of every app.

Part of **CompanyHub**, a multi-tenant, cloud-native microservices platform
built for the *Cloud Computing Services* course (RSO 2026/27, FRI UL).
See the [RSOcc26 organization](https://github.com/RSOcc26) for the other repositories.

> **Status:** scaffold — no implementation yet.

## Responsibilities

- The Hub shell: login, company switcher, navigation, mailbox and tasks
- Each app's screens, loaded inside the shell
- Shared UI kit: components, styles, translations
- Calling the platform only through the API gateway (`/api/...`)

The frontend holds no business rules and no secrets; every decision is made
by the services behind the gateway.

## How it is served

```
Browser ──▶ Ingress ──┬── /       ──▶ web      (this repo: static files, nginx)
                      └── /api/*  ──▶ gateway  ──▶ services
```

The build produces static files that an nginx container serves. The UI and
the API share one domain through the Ingress, so no CORS configuration is
needed and session cookies work as-is.

## Configuration

Runtime settings (for example the API base path) are injected when the
container starts, so one image runs in every environment.

| Variable | Required | Description |
|---|---|---|
| _To be defined._ | | |

## Getting started

Prerequisites: Node.js 24 (see `.nvmrc`) and Docker. A running gateway is
needed for anything beyond static screens.

_Commands will be added with the first implementation._

## Project structure

```
src/
  shell/        the Hub frame: login, navigation, company switcher
  apps/         one folder per app's screens
  shared/
    components/ reusable UI components
    api/        the client for the gateway API
    styles/     the shared UI kit styles
    i18n/       translations
public/         static assets copied as-is (icons, favicon)
nginx/          nginx configuration for the container
test/
  unit/         component and logic tests
  e2e/          end-to-end tests in a browser
docs/
  adr/          architecture decision records
```

## Deployment

Built as a container image and published to GitHub Container Registry.
Kubernetes manifests and Helm charts live in the deployment repository.

## Contributing

- Branch from `main` (`feat/…`, `fix/…`, `chore/…`) and open a pull request.
- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/).
- Pull requests need a review from a code owner and passing checks; they are squash-merged.
- Record notable changes in `CHANGELOG.md`.
