// An error response from the gateway, carrying its RFC 9457 problem document
export class ApiError extends Error {
  constructor(status, problem) {
    super(problem?.title ?? `Request failed with status ${status}`);
    this.status = status;
    this.problem = problem;
  }
}

// Calls the gateway on the same origin with the user's access token.
// The frontend never sends identity or tenant headers other than the token.
// A missing token or a 401 means the session has ended: onUnauthorized is
// called once per failure, in one place for every page.
export const createApiClient = ({ basePath, getAccessToken, onUnauthorized = () => {}, fetchImpl = (...args) => fetch(...args) }) =>
  async (path, { method = 'GET', body, signal } = {}) => {
    const token = await getAccessToken();
    if (!token) {
      onUnauthorized();
      throw new ApiError(401);
    }
    const headers = { accept: 'application/json', authorization: `Bearer ${token}` };
    if (body !== undefined) headers['content-type'] = 'application/json';

    const res = await fetchImpl(`${basePath}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });

    if (!res.ok) {
      if (res.status === 401) onUnauthorized();
      let problem;
      try {
        problem = await res.json();
      } catch {
        // Not JSON; the status alone describes the failure
      }
      throw new ApiError(res.status, problem);
    }
    return res.status === 204 ? null : res.json();
  };
