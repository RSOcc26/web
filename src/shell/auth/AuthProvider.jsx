import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ErrorResponse } from 'oidc-client-ts';
import { CALLBACK_PATH, safeReturnPath } from './userManager.js';

const AuthContext = createContext(null);

// The redirect callback may be handled only once (the code is single-use),
// even if the effect below runs twice
let callbackResult;
const completeSignIn = (userManager) => {
  callbackResult ??= userManager.signinRedirectCallback();
  return callbackResult;
};

export const AuthProvider = ({ userManager, children }) => {
  const [state, setState] = useState({ status: 'loading', user: null, error: null });
  // While signing out, the local session is cleared before the browser leaves
  // for the provider's logout; that must not count as "signed out" here, or the
  // shell would start a new sign-in that overtakes the logout navigation.
  const signingOut = useRef(false);
  // One refresh at a time: concurrent callers share it, so a rotated refresh
  // token is never used twice
  const renewing = useRef(null);

  useEffect(() => {
    let active = true;
    const signedIn = (user) => active && setState({ status: 'signedIn', user, error: null });
    const signedOut = (error = null) => active && setState({ status: 'signedOut', user: null, error });

    (async () => {
      if (window.location.pathname === CALLBACK_PATH) {
        try {
          const user = await completeSignIn(userManager);
          window.history.replaceState(null, '', safeReturnPath(user.state?.returnTo));
          signedIn(user);
        } catch (error) {
          window.history.replaceState(null, '', '/');
          signedOut(error);
        }
        return;
      }
      const user = await userManager.getUser();
      if (user && !user.expired) return signedIn(user);
      if (user) {
        // Expired access token: try the refresh token before asking to sign in again
        try {
          return signedIn(await userManager.signinSilent());
        } catch {
          await userManager.removeUser();
        }
      }
      signedOut();
    })();

    const onLoaded = (user) => signedIn(user);
    const onUnloaded = () => { if (!signingOut.current) signedOut(); };
    // A failed background renewal (for example a short network drop) keeps the
    // session: the token may still be valid, and getAccessToken retries on demand
    const onRenewError = (error) => console.warn('Token renewal failed; will retry when needed', error);
    userManager.events.addUserLoaded(onLoaded);
    userManager.events.addUserUnloaded(onUnloaded);
    userManager.events.addSilentRenewError(onRenewError);
    return () => {
      active = false;
      userManager.events.removeUserLoaded(onLoaded);
      userManager.events.removeUserUnloaded(onUnloaded);
      userManager.events.removeSilentRenewError(onRenewError);
    };
  }, [userManager]);

  // Kept stable across sign-in state changes so consumers do not refetch on token renewal
  const actions = useMemo(() => ({
    // ui_locales shows Keycloak's login page in the user's language
    signIn: (locale) => userManager.signinRedirect({
      ui_locales: locale,
      state: { returnTo: safeReturnPath(window.location.pathname + window.location.search) },
    }),
    signOut: async () => {
      signingOut.current = true;
      setState({ status: 'signingOut', user: null, error: null });
      try {
        await userManager.signoutRedirect();
      } catch (error) {
        // The provider could not be reached: the local session is gone anyway
        signingOut.current = false;
        await userManager.removeUser();
        setState({ status: 'signedOut', user: null, error });
      }
    },
    // The current access token, refreshed if expired; null when the session has ended
    getAccessToken: async () => {
      const user = await userManager.getUser();
      if (!user) return null;
      if (!user.expired) return user.access_token;
      renewing.current ??= userManager.signinSilent()
        .then((renewed) => renewed?.access_token ?? null)
        // Only the provider refusing the refresh ends the session; a network error is retryable
        .catch((err) => { if (err instanceof ErrorResponse) return null; throw err; })
        .finally(() => { renewing.current = null; });
      return renewing.current;
    },
  }), [userManager]);

  const value = useMemo(() => ({ ...state, ...actions }), [state, actions]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
