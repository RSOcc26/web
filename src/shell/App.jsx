import { useEffect, useState } from 'react';
import { config } from '../shared/config.js';
import { I18nProvider, useI18n } from '../shared/i18n/I18nProvider.jsx';
import { AuthProvider, useAuth } from './auth/AuthProvider.jsx';
import { createUserManager } from './auth/userManager.js';
import { LoginPage } from './LoginPage.jsx';
import { SignedInShell } from './SignedInShell.jsx';
import { ErrorBoundary } from './ErrorBoundary.jsx';

const userManager = createUserManager({ authority: config.oidcAuthority, clientId: config.oidcClientId });

// Signed-out users go straight to the CompanyCentral sign-in page (our
// Keycloak theme). LoginPage is shown only when that fails, so there is
// never a second "sign in" step.
const Shell = () => {
  const { status, error, signOutFailed, signIn } = useAuth();
  const { t, locale } = useI18n();
  const [redirectFailed, setRedirectFailed] = useState(false);
  const autoRedirect = status === 'signedOut' && !error && !redirectFailed;

  useEffect(() => {
    if (autoRedirect) signIn(locale).catch(() => setRedirectFailed(true));
    // Only on entering the signed-out state, not when the language changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRedirect]);

  if (status === 'signingOut') return <p className="loading" role="status">{t('auth.signingOut')}</p>;
  if (status === 'loading' || autoRedirect) {
    return <p className="loading" role="status">{t(status === 'loading' ? 'auth.loading' : 'login.redirecting')}</p>;
  }
  return status === 'signedIn' ? <SignedInShell /> : <LoginPage failed={redirectFailed} signOutFailed={signOutFailed} />;
};

// Hub shell root
export const App = () => (
  <ErrorBoundary>
    <I18nProvider defaultLocale={config.defaultLocale}>
      <AuthProvider userManager={userManager}>
        <Shell />
      </AuthProvider>
    </I18nProvider>
  </ErrorBoundary>
);
