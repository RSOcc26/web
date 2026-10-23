# Application manifest

> **Status:** contract defined; not implemented yet.

Every business application in CompanyCentral describes itself with a small
manifest. The Hub shell uses it to build navigation and routes. The Access
service's application registry uses the same `id`, so the shell can match
"enabled for this company" and "permitted for this user" to a module.

The manifest describes **how the UI module plugs into the shell**. Authorization
is still enforced by the services; hiding a menu entry is not a security
control.

## Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | yes | Stable application ID, lowercase kebab-case (`workflow`). Same ID as in the Access registry. Never changes. |
| `name` | object | yes | Display name per locale: `{ "sl": "…", "en": "…" }`. Both locales are required. |
| `version` | string | yes | Semantic version of the UI module (`1.2.0`). |
| `entryRoute` | string | yes | Route the shell mounts the module under, starting with `/apps/` (`/apps/workflow`). |
| `requiredPermissions` | string[] | yes | Permissions the user needs to see the application at all, as `<app-id>:<permission>` (`workflow:read`). May be empty. |
| `dependencies` | object | yes | What the module needs to work. See below. |
| `dependencies.applications` | object[] | no | Other applications that must be enabled for the company: `{ "id": "workflow", "version": "^1.0.0" }`. |
| `dependencies.services` | string[] | no | Backend services the module calls through the gateway (`service-inventory`). Used for documentation and health display. |
| `icon` | string | no | Icon name from the shared UI kit. |

Machine-readable schema: [app-manifest.schema.json](app-manifest.schema.json) (JSON Schema 2020-12).

## Example

```json
{
  "id": "production",
  "name": { "sl": "Proizvodnja", "en": "Production" },
  "version": "0.1.0",
  "entryRoute": "/apps/production",
  "requiredPermissions": ["production:read"],
  "dependencies": {
    "applications": [{ "id": "workflow", "version": "^0.1.0" }],
    "services": ["service-production", "service-inventory"]
  },
  "icon": "factory"
}
```

## First-milestone applications

| `id` | Module | Main services |
|---|---|---|
| `workflow` | `src/apps/workflow/` | `service-workflow` |
| `inventory` | `src/apps/inventory/` | `service-inventory` |
| `production` | `src/apps/production/` | `service-production`, `service-inventory` |

Company administration (users, memberships, enabled applications, roles) is
part of the Hub shell, not an application, and has no manifest.

## Rules

- A module exports exactly one manifest from `src/apps/<id>/manifest.json`
  (or an equivalent typed module).
- Changing `id` or `entryRoute` is a breaking change.
- `requiredPermissions` lists the minimum to *open* the application. Screens
  check further permissions themselves, and the services enforce them.
