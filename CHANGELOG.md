# Changelog

All notable changes to this repository are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and the project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- Initial repository scaffold.
- Sign-in with Keycloak (authorization code flow with PKCE, `oidc-client-ts`),
  sign-out, and token renewal with the refresh token.
- Signed-out users go straight to the CompanyCentral sign-in page (Keycloak
  with our theme); the app's own screen is only a fallback when sign-in fails.
- Bilingual (sl/en) fallback login screen and signed-in page with the profile from
  `GET /api/identity/v1/me`; language switch remembered per browser.
- Runtime configuration through `/config.js` (`OIDC_AUTHORITY`, `OIDC_CLIENT_ID`).
- Vite dev proxy from `/api` to the gateway; shared API client with
  problem-document errors; base styles with light and dark themes.
- Unit tests with Vitest (`npm test`).
- User administration for platform admins: user list with search, status
  filter and paging; edit name and email; delete with typed confirmation.
  "Users" appears in the navigation only for the `platform-admin` role.
- History-based routing in the Hub shell; a session the backend no longer
  accepts (for example a deleted account) shows a "session ended" screen
  whose button signs out fully, so sign-in can never loop.
- Error boundary: an unexpected error shows a message instead of a blank page.

### Fixed

- Logout was overtaken by an automatic sign-in and did not end the session.
- 401 handling lives in the shared API client for every page; a failed
  background token renewal no longer drops a still-valid session; concurrent
  refreshes share one request.
- Saving your own profile no longer unloads the page; the form shows the
  values the server stored; typing spaces in search keeps the current page; a
  malformed URL no longer crashes the app; dates are formatted in one place.
