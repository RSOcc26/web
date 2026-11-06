import { useEffect, useState } from 'react';
import { useI18n } from '../../shared/i18n/I18nProvider.jsx';
import { useShell } from '../SignedInShell.jsx';
import { Link, navigate, useLocation } from '../router.jsx';

const PAGE_SIZE = 25;

// Platform administration: all user accounts (ADR-0003)
export const UsersPage = () => {
  const { t, formatDate } = useI18n();
  const { api } = useShell();
  const { query } = useLocation();
  const [search, setSearch] = useState('');
  const [term, setTerm] = useState('');
  const [status, setStatus] = useState('active');
  const [offset, setOffset] = useState(0);
  const [result, setResult] = useState({ status: 'loading', items: [], total: 0 });
  const deletedNotice = query.get('deleted') === '1';

  // Search after the user stops typing; only a different term goes back to page 1
  useEffect(() => {
    const next = search.trim();
    if (next === term) return undefined;
    const timer = setTimeout(() => { setTerm(next); setOffset(0); }, 300);
    return () => clearTimeout(timer);
  }, [search, term]);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ status, limit: PAGE_SIZE, offset });
    if (term) params.set('search', term);
    setResult((r) => ({ ...r, status: 'loading' }));
    api(`/identity/v1/admin/users?${params}`, { signal: controller.signal })
      .then(({ items, total }) => setResult({ status: 'ok', items, total }))
      .catch((err) => err.name !== 'AbortError' && setResult({ status: 'error', items: [], total: 0 }));
    return () => controller.abort();
  }, [api, term, status, offset]);

  const last = Math.min(offset + PAGE_SIZE, result.total);

  return (
    <>
      <h1>{t('admin.users.title')}</h1>
      {deletedNotice && (
        <p className="notice" role="status">
          {t('admin.users.deletedNotice')}{' '}
          <button type="button" className="link-button" onClick={() => navigate('/admin/users', { replace: true })}>{t('common.dismiss')}</button>
        </p>
      )}
      <div className="toolbar">
        <label className="field field--grow">
          <span className="field__label">{t('admin.users.search')}</span>
          <input className="input" type="search" maxLength={100} value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('admin.users.searchPlaceholder')} />
        </label>
        <label className="field">
          <span className="field__label">{t('admin.users.status')}</span>
          <select className="input" value={status} onChange={(e) => { setStatus(e.target.value); setOffset(0); }}>
            <option value="active">{t('admin.status.active')}</option>
            <option value="deleted">{t('admin.status.deleted')}</option>
            <option value="all">{t('admin.status.all')}</option>
          </select>
        </label>
      </div>

      <section className="card card--flush" aria-busy={result.status === 'loading'}>
        {result.status === 'error' && <p className="alert" role="alert">{t('admin.users.loadError')}</p>}
        {result.status !== 'error' && (
          <table className="table">
            <thead>
              <tr>
                <th scope="col">{t('admin.users.name')}</th>
                <th scope="col">{t('admin.users.email')}</th>
                <th scope="col">{t('admin.users.status')}</th>
                <th scope="col">{t('admin.users.created')}</th>
              </tr>
            </thead>
            <tbody>
              {result.items.map((u) => (
                <tr key={u.id}>
                  <td><Link to={`/admin/users/${u.id}`}>{u.displayName ?? t('admin.users.deletedName')}</Link></td>
                  <td>{u.email ?? '—'}</td>
                  <td><span className={`badge badge--${u.status}`}>{t(`admin.status.${u.status}`)}</span></td>
                  <td>{formatDate(u.createdAt)}</td>
                </tr>
              ))}
              {result.status === 'ok' && result.items.length === 0 && (
                <tr><td colSpan={4} className="muted">{t('admin.users.empty')}</td></tr>
              )}
            </tbody>
          </table>
        )}
      </section>

      {result.total > PAGE_SIZE && (
        <div className="pager">
          <span className="muted">{t('admin.users.range', { first: offset + 1, last, total: result.total })}</span>
          <button type="button" className="button" disabled={offset === 0} onClick={() => setOffset(offset - PAGE_SIZE)}>{t('common.previous')}</button>
          <button type="button" className="button" disabled={last >= result.total} onClick={() => setOffset(offset + PAGE_SIZE)}>{t('common.next')}</button>
        </div>
      )}
    </>
  );
};
