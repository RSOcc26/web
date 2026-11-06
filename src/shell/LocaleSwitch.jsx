import { useI18n } from '../shared/i18n/I18nProvider.jsx';

export const LocaleSwitch = () => {
  const { locale, setLocale, t } = useI18n();
  const other = locale === 'sl' ? 'en' : 'sl';
  return (
    <button type="button" className="button button--ghost" lang={other} onClick={() => setLocale(other)}>
      {t('locale.switchTo')}
    </button>
  );
};
