import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../../shared/i18n/I18nProvider.jsx';
import { useShell } from '../SignedInShell.jsx';
import { Link, navigate } from '../router.jsx';

// Fields an admin may change; the email is also the sign-in name
const EDITABLE = ['givenName', 'familyName', 'email'];

const changedFields = (form, user) =>
  Object.fromEntries(EDITABLE.filter((k) => form[k].trim() !== (user[k] ?? '')).map((k) => [k, form[k].trim()]));

export const UserPage = ({ id }) => {
  const { t, formatDate } = useI18n();
  const { api, me, reloadMe } = useShell();
  const [user, setUser] = useState({ status: 'loading', data: null });
  const [form, setForm] = useState({ givenName: '', familyName: '', email: '' });
  const [save, setSave] = useState({ status: 'idle', error: null });
  const dialog = useRef(null);
  const [confirmText, setConfirmText] = useState('');
  const [removal, setRemoval] = useState({ status: 'idle', error: null });

  // The form always mirrors what the server stored (it may normalize values)
  const showUser = (data) => {
    setUser({ status: 'ok', data });
    setForm({ givenName: data.givenName ?? '', familyName: data.familyName ?? '', email: data.email ?? '' });
  };

  useEffect(() => {
    const controller = new AbortController();
    api(`/identity/v1/admin/users/${encodeURIComponent(id)}`, { signal: controller.signal })
      .then(showUser)
      .catch((err) => err.name !== 'AbortError' && setUser({ status: err.status === 404 ? 'missing' : 'error', data: null }));
    return () => controller.abort();
  }, [api, id]);

  const back = <p><Link to="/admin/users">← {t('admin.user.back')}</Link></p>;
  if (user.status === 'loading') return <>{back}<p className="muted" role="status">{t('common.loading')}</p></>;
  if (user.status !== 'ok') return <>{back}<p className="alert" role="alert">{t(user.status === 'missing' ? 'admin.user.missing' : 'admin.user.loadError')}</p></>;

  const u = user.data;
  const isSelf = u.id === me.id;
  const changes = changedFields(form, u);
  const dirty = Object.keys(changes).length > 0;

  const onSave = async (event) => {
    event.preventDefault();
    setSave({ status: 'saving', error: null });
    try {
      const data = await api(`/identity/v1/admin/users/${u.id}`, { method: 'PATCH', body: changes });
      showUser(data);
      setSave({ status: 'saved', error: null });
      if (isSelf) reloadMe();
    } catch (err) {
      const key = { 409: 'admin.user.emailTaken', 400: 'admin.user.invalid', 503: 'admin.user.unavailable' }[err.status] ?? 'admin.user.saveError';
      setSave({ status: 'idle', error: key });
    }
  };

  const onDelete = async () => {
    setRemoval({ status: 'deleting', error: null });
    try {
      await api(`/identity/v1/admin/users/${u.id}`, { method: 'DELETE' });
      dialog.current?.close();
      navigate('/admin/users?deleted=1');
    } catch {
      setRemoval({ status: 'idle', error: 'admin.user.deleteError' });
    }
  };

  const field = (name, type = 'text', autoComplete = 'off') => (
    <label className="field">
      <span className="field__label">{t(`admin.user.${name}`)}</span>
      <input
        className="input" type={type} required autoComplete={autoComplete} maxLength={name === 'email' ? 254 : 100}
        value={form[name]} onChange={(e) => { setForm({ ...form, [name]: e.target.value }); setSave({ status: 'idle', error: null }); }}
      />
    </label>
  );

  return (
    <>
      {back}
      <h1>{u.displayName ?? t('admin.users.deletedName')}</h1>

      {u.status === 'deleted' ? (
        <section className="card">
          <p>{t('admin.user.deletedInfo', { date: formatDate(u.deletedAt, 'dateTime') })}</p>
          <dl className="fields"><dt>{t('common.id')}</dt><dd><code>{u.id}</code></dd></dl>
        </section>
      ) : (
        <>
          <form className="card form" onSubmit={onSave} aria-labelledby="profile-heading">
            <h2 id="profile-heading">{t('admin.user.profile')}</h2>
            <div className="form__row">
              {field('givenName')}
              {field('familyName')}
            </div>
            {field('email', 'email')}
            <p className="muted small">{t('admin.user.emailHint')}</p>
            {save.error && <p className="alert" role="alert">{t(save.error)}</p>}
            {save.status === 'saved' && !dirty && <p className="notice" role="status">{t('admin.user.saved')}</p>}
            <div className="form__actions">
              <button type="submit" className="button button--primary" disabled={!dirty || save.status === 'saving'}>
                {save.status === 'saving' ? t('common.saving') : t('common.save')}
              </button>
            </div>
            <dl className="fields small">
              <dt>{t('admin.users.created')}</dt><dd>{formatDate(u.createdAt, 'dateTime')}</dd>
              <dt>{t('common.id')}</dt><dd><code>{u.id}</code></dd>
            </dl>
          </form>

          <section className="card card--danger" aria-labelledby="danger-heading">
            <h2 id="danger-heading">{t('admin.user.deleteTitle')}</h2>
            <p>{t('admin.user.deleteExplain')}</p>
            {isSelf ? (
              <p className="muted">{t('admin.user.deleteSelf')}</p>
            ) : (
              <button type="button" className="button button--danger" onClick={() => { setConfirmText(''); setRemoval({ status: 'idle', error: null }); dialog.current?.showModal(); }}>
                {t('admin.user.deleteButton')}
              </button>
            )}
          </section>

          <dialog ref={dialog} className="dialog" aria-labelledby="confirm-heading">
            <h2 id="confirm-heading">{t('admin.user.confirmTitle')}</h2>
            <p>{t('admin.user.confirmText', { email: u.email })}</p>
            <label className="field">
              <span className="field__label">{t('admin.user.confirmLabel')}</span>
              <input className="input" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} autoComplete="off" />
            </label>
            {removal.error && <p className="alert" role="alert">{t(removal.error)}</p>}
            <div className="form__actions">
              <button type="button" className="button" onClick={() => dialog.current?.close()}>{t('common.cancel')}</button>
              <button
                type="button" className="button button--danger" onClick={onDelete}
                disabled={confirmText.trim().toLowerCase() !== u.email.toLowerCase() || removal.status === 'deleting'}
              >
                {removal.status === 'deleting' ? t('admin.user.deleting') : t('admin.user.deleteButton')}
              </button>
            </div>
          </dialog>
        </>
      )}
    </>
  );
};
