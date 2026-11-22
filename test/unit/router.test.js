import { test, expect } from 'vitest';
import { matchPath } from '../../src/shell/router.jsx';

test('matchPath extracts parameters and rejects other paths', () => {
  expect(matchPath('/admin/users/:id', '/admin/users/abc-1')).toEqual({ id: 'abc-1' });
  expect(matchPath('/admin/users/:id', '/admin/users/abc-1/')).toEqual({ id: 'abc-1' });
  expect(matchPath('/admin/users/:id', '/admin/users/a%20b')).toEqual({ id: 'a b' });
  expect(matchPath('/admin/users/:id', '/admin/users')).toBeNull();
  expect(matchPath('/admin/users/:id', '/admin/users/a/b')).toBeNull();
  expect(matchPath('/admin/users', '/admin/users')).toEqual({});
});

test('matchPath treats malformed escapes as no match instead of throwing', () => {
  expect(matchPath('/admin/users/:id', '/admin/users/100%')).toBeNull();
  expect(matchPath('/admin/users/:id', '/admin/users/%E0%A4')).toBeNull();
});
