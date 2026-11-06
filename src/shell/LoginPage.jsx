import { useState } from 'react';
import { useI18n } from '../shared/i18n/I18nProvider.jsx';
import { useAuth } from './auth/AuthProvider.jsx';
import { LocaleSwitch } from './LocaleSwitch.jsx';

// Fallback shown only when sign-in could not start or complete (for example
// the identity provider is unreachable). The normal sign-in page is the
// CompanyCentral Keycloak theme; this app never sees a password.
export const LoginPage = ({ failed: initiallyFailed = false }) => {
  const { t, locale } = useI18n();
  const { signIn } = useAuth();
  const [redirecting, setRedirecting] = useState(false);
  const [failed, setFailed] = useState(initiallyFailed);

  const onRetry = async () => {
    setRedirecting(true);
    setFailed(false);
    try {
      await signIn(locale);
    } catch {
      setRedirecting(false);
      setFailed(true);
    }
  };

  return (
    <main className="login">
      <div className="login__corner"><LocaleSwitch /></div>
      <section className="card login__card" aria-labelledby="login-title">
        <p className="brand">{t('app.name')}</p>
        <h1 id="login-title">{t('login.title')}</h1>
        <p className="alert" role="alert">{t(failed ? 'login.unavailable' : 'login.error')}</p>
        <button type="button" className="button button--primary button--block" onClick={onRetry} disabled={redirecting}>
          {redirecting ? t('login.redirecting') : t('login.retry')}
        </button>
      </section>
    </main>
  );
};
