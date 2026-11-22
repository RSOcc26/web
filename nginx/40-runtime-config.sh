#!/bin/sh
# Writes /tmp/config.js (window.__APP_CONFIG__) from the environment, so one
# image runs in every environment, and the optional /api proxy for local
# Compose (in Kubernetes the Ingress routes /api to the gateway).
set -eu

# JSON string with backslashes and quotes escaped
json() { printf '"%s"' "$(printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g')"; }

{
  echo 'window.__APP_CONFIG__ = {'
  if [ -n "${API_BASE_PATH:-}" ]; then echo "  apiBasePath: $(json "$API_BASE_PATH"),"; fi
  if [ -n "${DEFAULT_LOCALE:-}" ]; then echo "  defaultLocale: $(json "$DEFAULT_LOCALE"),"; fi
  if [ -n "${OIDC_AUTHORITY:-}" ]; then echo "  oidcAuthority: $(json "$OIDC_AUTHORITY"),"; fi
  if [ -n "${OIDC_CLIENT_ID:-}" ]; then echo "  oidcClientId: $(json "$OIDC_CLIENT_ID"),"; fi
  echo '};'
} > /tmp/config.js

mkdir -p /tmp/nginx
rm -f /tmp/nginx/api.conf
if [ -n "${GATEWAY_URL:-}" ]; then
  case "$GATEWAY_URL" in
    http://*|https://*) ;;
    *) echo "GATEWAY_URL must start with http:// or https://" >&2; exit 1 ;;
  esac
  # Reject anything that could break out of the nginx directive
  if printf '%s' "$GATEWAY_URL" | grep -q '[;{}[:space:]]'; then
    echo "GATEWAY_URL contains invalid characters" >&2; exit 1
  fi
  cat > /tmp/nginx/api.conf <<CONF
location /api/ {
    proxy_pass ${GATEWAY_URL%/};
    proxy_set_header Host \$host;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
}
CONF
else
  # Without a gateway, /api must not fall through to the SPA's index.html
  echo 'location /api/ { return 404; }' > /tmp/nginx/api.conf
fi
