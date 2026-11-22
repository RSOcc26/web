import { test, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

// The container start-up script; it writes to /tmp, as it does in the image
const SCRIPT = new URL('../../nginx/40-runtime-config.sh', import.meta.url).pathname;
const run = (env) => spawnSync('sh', [SCRIPT], { env: { PATH: process.env.PATH, ...env }, encoding: 'utf8' });
const appConfig = () => {
  const window = {};
  runInNewContext(readFileSync('/tmp/config.js', 'utf8'), { window });
  return window.__APP_CONFIG__;
};
const apiConf = () => readFileSync('/tmp/nginx/api.conf', 'utf8');

test('config.js holds the environment values as valid JavaScript, quotes escaped', () => {
  expect(run({
    API_BASE_PATH: '/api',
    DEFAULT_LOCALE: 'en',
    OIDC_AUTHORITY: 'http://kc/realms/a"b\\c',
    OIDC_CLIENT_ID: 'web',
  }).status).toBe(0);
  expect(appConfig()).toEqual({
    apiBasePath: '/api',
    defaultLocale: 'en',
    oidcAuthority: 'http://kc/realms/a"b\\c',
    oidcClientId: 'web',
  });
});

test('unset values are left out, so the app defaults apply', () => {
  expect(run({}).status).toBe(0);
  expect(appConfig()).toEqual({});
});

test('without GATEWAY_URL, /api answers 404 instead of the SPA', () => {
  run({});
  expect(apiConf()).toContain('return 404;');
});

test('GATEWAY_URL proxies /api to the gateway', () => {
  expect(run({ GATEWAY_URL: 'http://gateway:8080/' }).status).toBe(0);
  expect(apiConf()).toContain('proxy_pass http://gateway:8080;');
});

test('a GATEWAY_URL that is not plain http(s) or could inject nginx config stops the container', () => {
  for (const url of ['ftp://gateway', 'http://x; return 200', 'http://x }', 'http://x y']) {
    expect(run({ GATEWAY_URL: url }).status, url).not.toBe(0);
  }
});
