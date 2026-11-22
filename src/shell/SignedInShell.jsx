import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { config } from '../shared/config.js';
import { createApiClient } from '../shared/api/client.js';
import { useI18n } from '../shared/i18n/I18nProvider.jsx';
import { useAuth } from './auth/AuthProvider.jsx';
import { LocaleSwitch } from './LocaleSwitch.jsx';
import { Link, matchPath, useLocation } from './router.jsx';
import { HomePage } from './HomePage.jsx';
import { UsersPage } from './admin/UsersPage.jsx';
import { UserPage } from './admin/UserPage.jsx';

const ShellContext = createContext(null);
export const useShell = () => useContext(ShellContext);

const isAdmin = (me) => me?.platformRoles?.includes('platform-admin');

// Shown when the backend no longer accepts the session (expired, revoked or a
// deleted account). Signing in again goes through a full logout first, so the
// provider's session ends too and the app cannot loop back in automatically.
const SessionEnded = () => {
  const { t } = useI18n();
  const { signOut } = useAuth();
  return (
    <main className="login">
      <section className="card login__card" aria-labelledby="ended-title">
        <p className="brand">{t('app.name')}</p>
        <h1 id="ended-title">{t('session.endedTitle')}</h1>
        <p className="muted">{t('session.endedText')}</p>
        <button type="button" className="button button--primary button--block" onClick={() => signOut()}>
          {t('session.signInAgain')}
        </button>
      </section>
    </main>
  );
};

// The signed-in Hub: loads the current user once, then routes between pages
export const SignedInShell = () => {
  const { t } = useI18n();
  const { signOut, getAccessToken } = useAuth();
  const { pathname } = useLocation();
  const [sessionEnded, setSessionEnded] = useState(false);
  const api = useMemo(() => createApiClient({
    basePath: config.apiBasePath,
    getAccessToken,
    onUnauthorized: () => setSessionEnded(true),
  }), [getAccessToken]);
  const [me, setMe] = useState({ status: 'loading', data: null });

  // The first load shows a loading state; later reloads (after editing your
  // own profile) keep the current page and only swap the data
  const loadMe = useCallback(async ({ background = false } = {}) => {
    if (!background) setMe({ status: 'loading', data: null });
    try {
      setMe({ status: 'ok', data: await api('/identity/v1/me') });
    } catch (err) {
      if (!background && err.status !== 401) setMe({ status: 'error', data: null });
    }
  }, [api]);

  useEffect(() => { loadMe(); }, [loadMe]);

  const reloadMe = useCallback(() => loadMe({ background: true }), [loadMe]);
  const shell = useMemo(() => ({ api, me: me.data, reloadMe }), [api, me.data, reloadMe]);
  if (sessionEnded) return <SessionEnded />;

  const admin = isAdmin(me.data);
  const userParams = matchPath('/admin/users/:id', pathname);

  let page;
  if (me.status === 'loading') page = <p className="muted" role="status">{t('home.loading')}</p>;
  else if (me.status === 'error') {
    page = (
      <div className="alert" role="alert">
        <p>{t('home.error')}</p>
        <button type="button" className="button" onClick={() => loadMe()}>{t('home.retry')}</button>
      </div>
    );
  } else if (pathname.startsWith('/admin') && !admin) page = <p className="alert" role="alert">{t('admin.forbidden')}</p>;
  else if (matchPath('/admin/users', pathname)) page = <UsersPage />;
  else if (userParams) page = <UserPage key={userParams.id} id={userParams.id} />;
  else page = <HomePage />;

  return (
    <ShellContext.Provider value={shell}>
      <div className="shell">
        <header className="topbar">
          <nav className="topbar__nav" aria-label={t('nav.main')}>
            <Link to="/" className="brand">{t('app.name')}</Link>
            {admin && (
              <Link to="/admin/users" className="topbar__link" aria-current={pathname.startsWith('/admin/users') ? 'page' : undefined}>
                {t('nav.users')}
              </Link>
            )}
          </nav>
          <div className="topbar__actions">
            <LocaleSwitch />
            <button type="button" className="button" onClick={() => signOut()}>{t('nav.signOut')}</button>
          </div>
        </header>
        <main className="content">{page}</main>
      </div>
    </ShellContext.Provider>
  );
};
