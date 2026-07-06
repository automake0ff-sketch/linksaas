# Especificación de APIs — LinkForge

REST como API principal (documentada con OpenAPI/Swagger, generada automáticamente desde los DTOs de Nest.js con `@nestjs/swagger`). Se evalúa GraphQL solo para el editor (lecturas anidadas de página+bloques+tema en una sola consulta) si REST resulta insuficiente — decisión que se toma con datos reales en la Fase A, no de antemano.

## Convenciones

- Base URL: `https://api.linkforge.com/v1`
- Auth: Bearer JWT (access token de vida corta 15 min) + refresh token (httpOnly cookie, rotación en cada uso).
- Todas las rutas de recursos de workspace llevan el `workspace_id` implícito por el contexto de auth (no en la URL), evitando IDOR por manipulación de path.
- Errores: formato uniforme `{ code, message, details? }`, códigos HTTP semánticos (400/401/403/404/409/422/429/500).
- Rate limiting: por defecto 100 req/min por usuario autenticado, configurable por plan.
- Idempotencia: endpoints de escritura críticos (checkout, publicar) aceptan header `Idempotency-Key`.

## Endpoints núcleo (Fase A)

```
POST   /auth/register
POST   /auth/login
POST   /auth/oauth/:provider/callback
POST   /auth/passkey/register
POST   /auth/passkey/login
POST   /auth/2fa/verify
POST   /auth/refresh
POST   /auth/logout

GET    /me
PATCH  /me
DELETE /me
GET    /me/export                      # GDPR export

GET    /workspaces
POST   /workspaces
GET    /workspaces/:id
PATCH  /workspaces/:id
DELETE /workspaces/:id
POST   /workspaces/:id/members
PATCH  /workspaces/:id/members/:memberId
DELETE /workspaces/:id/members/:memberId

GET    /pages/:pageId
POST   /pages/:pageId/blocks
PATCH  /pages/:pageId/blocks/:blockId
DELETE /pages/:pageId/blocks/:blockId
PUT    /pages/:pageId/blocks/reorder
POST   /pages/:pageId/publish
GET    /pages/:pageId/versions
POST   /pages/:pageId/versions/:versionId/restore

GET    /themes
POST   /themes
PATCH  /themes/:id

GET    /analytics/summary?from=&to=
GET    /analytics/events?page_id=&event_type=
```

## Endpoints Fase B (comercio)

```
GET    /products
POST   /products
PATCH  /products/:id
POST   /checkout/session          # crea sesión de pago con el proveedor configurado
POST   /webhooks/stripe
POST   /webhooks/paddle
GET    /orders
```

## Endpoints Fase C (automatización y plugins)

```
GET    /workflows
POST   /workflows
PATCH  /workflows/:id
POST   /workflows/:id/toggle
GET    /workflows/:id/runs

GET    /plugins/catalog
POST   /plugins/:key/install
DELETE /plugins/:key/uninstall
POST   /webhooks/incoming/:workspaceId/:pluginKey   # entrada genérica para plugins externos
```

## Endpoints Fase D (IA)

```
POST   /ai/generate/bio
POST   /ai/generate/copy
POST   /ai/generate/seo-suggestions
POST   /ai/assistant/chat          # streaming SSE
POST   /ai/agents/:agentKey/run
```

## Página pública (servida por `web-public`, no por la API autenticada)

La página pública NO llama a la API autenticada en cada visita — `web-public` lee directamente de una vista de solo-lectura optimizada (o cache de edge) para evitar acoplar el tráfico público de altísimo volumen al sistema transaccional. Solo los eventos de analítica (`POST /public/events`, sin auth, rate-limited y validado por origen) tocan la API en el camino de lectura pública.

## Documentación

- OpenAPI generado automáticamente en `/v1/docs` (Swagger UI) y `/v1/openapi.json`.
- Cada módulo del backend documenta sus DTOs con decoradores; no se mantiene documentación manual desincronizada del código.
