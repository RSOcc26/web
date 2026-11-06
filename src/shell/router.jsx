import { useSyncExternalStore } from 'react';

// Minimal history-based routing for the Hub shell (no router dependency)
const listeners = new Set();
const notify = () => listeners.forEach((listener) => listener());
const subscribe = (listener) => {
  listeners.add(listener);
  window.addEventListener('popstate', listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('popstate', listener);
  };
};

export const navigate = (to, { replace = false } = {}) => {
  window.history[replace ? 'replaceState' : 'pushState'](null, '', to);
  notify();
};

export const useLocation = () => {
  const href = useSyncExternalStore(subscribe, () => window.location.pathname + window.location.search);
  const url = new URL(href, 'http://local');
  return { pathname: url.pathname, query: url.searchParams };
};

// Matches "/admin/users/:id" style patterns; returns the params or null
export const matchPath = (pattern, pathname) => {
  const names = [];
  const regex = new RegExp(`^${pattern.replace(/:([a-z]+)/gi, (m, name) => { names.push(name); return '([^/]+)'; })}/?$`);
  const match = regex.exec(pathname);
  if (!match) return null;
  try {
    return Object.fromEntries(names.map((name, i) => [name, decodeURIComponent(match[i + 1])]));
  } catch {
    // A malformed escape (for example "/admin/users/100%") matches nothing
    return null;
  }
};

export const Link = ({ to, onClick, ...props }) => (
  <a
    href={to}
    onClick={(event) => {
      onClick?.(event);
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      navigate(to);
    }}
    {...props}
  />
);
