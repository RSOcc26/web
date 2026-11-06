import { UserManager, WebStorageStateStore } from 'oidc-client-ts';

export const CALLBACK_PATH = '/auth/callback';

// OIDC authorization code flow with PKCE against Keycloak (ADR-0002). The web
// client is public: no client secret exists. Tokens are kept in sessionStorage
// (cleared when the tab closes) and renewed with the refresh token.
export const createUserManager = ({ authority, clientId, origin = window.location.origin }) => new UserManager({
  authority,
  client_id: clientId,
  redirect_uri: `${origin}${CALLBACK_PATH}`,
  post_logout_redirect_uri: `${origin}/`,
  response_type: 'code',
  scope: 'openid profile email',
  userStore: new WebStorageStateStore({ store: window.sessionStorage }),
  automaticSilentRenew: true,
});

// Only same-origin paths are accepted as a place to return to after sign-in
export const safeReturnPath = (value) =>
  typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') && value !== CALLBACK_PATH
    ? value
    : '/';
