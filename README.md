# web

CompanyCentral web frontend (React): the Hub shell and the user interface of
every application.

Part of **CompanyCentral**, a multi-tenant, cloud-native platform built for
the *Cloud Computing Services* course (RSO 2026/27, FRI UL).
See the [architecture](https://github.com/RSOcc26/.github/blob/main/docs/architecture.md) and the
[RSOcc26 organization](https://github.com/RSOcc26) for the other repositories.

> **Status:** first slice: sign-in with Keycloak and a signed-in page showing
> the user's profile from `service-identity`. Company switcher and
> application modules are not built yet.

## Responsibilities

- The Hub shell: login, company switcher, application navigation
- One UI module per business application (first milestone: Workflow,
  Inventory, Production), each described by an [application manifest](docs/app-manifest.md)
- Shared UI kit: components and styles
- Shared API clients for the gateway
- Slovenian and English localization of all user-facing text
- Calling the platform only through the API gateway (`/api/...`)

The frontend holds no business rules and no secrets; every decision is made
by the services behind the gateway.

## Application modules

The frontend is **one React application**. Business applications are modules
under `src/apps/<app-id>/`, built and deployed together with the shell. There
are no runtime microfrontends and no module federation. Modules never import
from each other, so they can be split into separate bundles later if needed.

Each module exports a manifest: application ID, name, version, entry route,
required permissions and dependencies. The contract is in
[docs/app-manifest.md](docs/app-manifest.md), with a JSON Schema in
[docs/app-manifest.schema.json](docs/app-manifest.schema.json).

The shell shows an application only when the current company has it enabled
and the user has its required permissions. Both come from the Access service
through the gateway. Hiding is for convenience only; the services enforce
access.

The company switcher changes the *requested* company. The gateway checks
membership on every call, so switching never grants access by itself.

## How it is served

```
Browser ──▶ Ingress ──┬── /       ──▶ web      (this repo: static files, nginx)
                      └── /api/*  ──▶ gateway  ──▶ services
```

The build produces static files that an nginx container serves. The UI and
the API share one domain through the Ingress, so no CORS configuration is
needed. In development the Vite server proxies `/api` to the gateway
(`GATEWAY_URL`, default `http://localhost:8080`) for the same effect.

## Sign-in

The browser signs in directly with Keycloak using the OIDC authorization code
flow with PKCE ([ADR-0002](https://github.com/RSOcc26/.github/blob/main/docs/adr/0002-identity-provider.md)),
through [`oidc-client-ts`](https://github.com/authts/oidc-client-ts). The `web`
client is public (no secret). Signed-out users are sent straight to the
sign-in page, which is Keycloak serving our own login theme (in the deploy
repository, `compose/keycloak/themes/companycentral`), in the user's language
(`ui_locales`). Passwords are entered only there; this app never sees them.
The app's own login screen appears only if sign-in cannot start or fails.

## User administration

Platform admins (Keycloak realm role `platform-admin`) see **Users** in the
navigation: `/admin/users` lists accounts, `/admin/users/{id}` edits names and
email and deletes a user after typing their email to confirm. The rules
(Keycloak sync, anonymization, retries) live in `service-identity`; see
[ADR-0003](https://github.com/RSOcc26/.github/blob/main/docs/adr/0003-user-lifecycle.md).
The production nginx must serve `index.html` for these paths (history
routing); the Vite dev server already does. Tokens live in `sessionStorage`
and are renewed with the refresh token; every API call sends the access token
to the gateway, which replaces it with its own signed context. The redirect
URI is `/auth/callback` and must be allowed on the Keycloak client.

## Configuration

Runtime settings are written to `/config.js` (`window.__APP_CONFIG__`) when
the container starts, so one image runs in every environment.
`public/config.js` holds the local development values.

| Variable | Required | Description |
|---|---|---|
| `API_BASE_PATH` | no | Path of the gateway on the same origin (default `/api`) |
| `DEFAULT_LOCALE` | no | `sl` or `en` (default `sl`) |
| `OIDC_AUTHORITY` | yes | Keycloak realm URL as the browser reaches it |
| `OIDC_CLIENT_ID` | no | Public OIDC client (default `web`) |

See [`.env.example`](.env.example).

## Getting started

Prerequisites: Node.js 24 (see `.nvmrc`) and Docker. A running gateway is
needed for anything beyond static screens.

```
npm install
npm run dev     # http://localhost:5173, proxies /api to the gateway
npm test        # unit tests (Vitest)
npm run build   # static files in dist/
```

For signing in you need Keycloak (deploy Compose stack), the gateway and
`service-identity` running. Create an account with "Register" on the Keycloak
page.

## Project structure

```
src/
  shell/        the Hub frame: login, navigation, company switcher
  apps/         one folder per application: screens and manifest
  shared/
    components/ reusable UI components
    api/        shared API clients for the gateway
    styles/     the shared UI kit styles
    i18n/       Slovenian and English translations
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

## License

[MIT](LICENSE)
