import { test, expect, vi } from 'vitest';
import { createApiClient, ApiError } from '../../src/shared/api/client.js';

const client = (fetchImpl, token = 'tok') =>
  createApiClient({ basePath: '/api', getAccessToken: async () => token, fetchImpl });

test('calls the gateway with the bearer token', async () => {
  const fetchImpl = vi.fn(async () => Response.json({ id: 'u1' }));
  expect(await client(fetchImpl)('/identity/v1/me')).toEqual({ id: 'u1' });
  const [url, init] = fetchImpl.mock.calls[0];
  expect(url).toBe('/api/identity/v1/me');
  expect(init.method).toBe('GET');
  expect(init.headers.authorization).toBe('Bearer tok');
  expect(init.body).toBeUndefined();
});

test('without a token it reports the session as ended and sends nothing', async () => {
  const fetchImpl = vi.fn(async () => Response.json({}));
  const onUnauthorized = vi.fn();
  const api = createApiClient({ basePath: '/api', getAccessToken: async () => null, onUnauthorized, fetchImpl });
  const err = await api('/x').catch((e) => e);
  expect(err.status).toBe(401);
  expect(onUnauthorized).toHaveBeenCalledOnce();
  expect(fetchImpl).not.toHaveBeenCalled();
});

test('a 401 from the gateway reports the session as ended', async () => {
  const onUnauthorized = vi.fn();
  const api = createApiClient({
    basePath: '/api', getAccessToken: async () => 'tok', onUnauthorized,
    fetchImpl: async () => new Response(null, { status: 401 }),
  });
  await expect(api('/x')).rejects.toMatchObject({ status: 401 });
  expect(onUnauthorized).toHaveBeenCalledOnce();
});

test('other errors do not end the session', async () => {
  const onUnauthorized = vi.fn();
  const api = createApiClient({
    basePath: '/api', getAccessToken: async () => 'tok', onUnauthorized,
    fetchImpl: async () => new Response(null, { status: 403 }),
  });
  await expect(api('/x')).rejects.toMatchObject({ status: 403 });
  expect(onUnauthorized).not.toHaveBeenCalled();
});

test('sends JSON bodies', async () => {
  const fetchImpl = vi.fn(async () => new Response(null, { status: 204 }));
  expect(await client(fetchImpl)('/x', { method: 'POST', body: { a: 1 } })).toBeNull();
  const [, init] = fetchImpl.mock.calls[0];
  expect(init.headers['content-type']).toBe('application/json');
  expect(init.body).toBe('{"a":1}');
});

test('throws ApiError with the problem document on failure', async () => {
  const fetchImpl = async () => new Response(JSON.stringify({ title: 'Unauthorized', status: 401 }), {
    status: 401, headers: { 'content-type': 'application/problem+json' },
  });
  const err = await client(fetchImpl)('/x').catch((e) => e);
  expect(err).toBeInstanceOf(ApiError);
  expect(err.status).toBe(401);
  expect(err.problem.title).toBe('Unauthorized');
});

test('throws ApiError when the error body is not JSON', async () => {
  const err = await client(async () => new Response('bad gateway', { status: 502 }))('/x').catch((e) => e);
  expect(err.status).toBe(502);
  expect(err.problem).toBeUndefined();
});
