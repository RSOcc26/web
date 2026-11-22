// Runtime configuration. These are the local development values; the container
// overwrites this file at startup from its environment, so one build runs in
// every environment. Never put secrets here: everything is public.
window.__APP_CONFIG__ = {
  apiBasePath: '/api',
  defaultLocale: 'sl',
  oidcAuthority: 'http://localhost:8180/realms/companycentral',
  oidcClientId: 'web',
};
