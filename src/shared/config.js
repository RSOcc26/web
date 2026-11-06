// Runtime configuration from public/config.js (see .env.example)
const defaults = {
  apiBasePath: '/api',
  defaultLocale: 'sl',
  oidcAuthority: '',
  oidcClientId: 'web',
};

export const config = { ...defaults, ...(globalThis.__APP_CONFIG__ ?? {}) };
