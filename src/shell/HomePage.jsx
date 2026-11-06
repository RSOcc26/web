import { useI18n } from '../shared/i18n/I18nProvider.jsx';
import { useShell } from './SignedInShell.jsx';

// Signed-in start page with the user's profile from Identity
export const HomePage = () => {
  const { t } = useI18n();
  const { me } = useShell();
  return (
    <>
      <h1>{t('home.welcome', { name: me.displayName })}</h1>
      <section className="card" aria-labelledby="profile-title">
        <h2 id="profile-title">{t('home.profile')}</h2>
        <dl className="fields">
          <dt>{t('home.email')}</dt>
          <dd>{me.email}</dd>
          <dt>{t('home.locale')}</dt>
          <dd>{t(`locale.label.${me.locale}`)}</dd>
        </dl>
      </section>
    </>
  );
};
