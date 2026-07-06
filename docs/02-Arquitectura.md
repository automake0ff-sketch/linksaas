# Arquitectura — LinkForge

## 1. Vista de alto nivel

Monolito modular (Nest.js) detrás de un edge cacheante (Cloudflare), con Next.js sirviendo tanto el panel de administración (app autenticada) como las páginas públicas (SSR + ISR). Redis para cache/colas, PostgreSQL como fuente de verdad, R2 para binarios.

**Por qué esta separación (Next.js panel vs Next.js página pública, mismo framework):**
- El panel necesita interactividad rica (editor drag&drop) → client components + TanStack Query.
- La página pública necesita ser ultrarrápida y SEO-perfecta → server components, cache en edge, cero JS innecesario. Compartir framework (Next.js) permite reutilizar el sistema de diseño y el renderer de bloques entre ambos sin duplicar código, mientras cada ruta se optimiza distinto.

## 2. Módulos del backend (Nest.js, monolito modular)

Cada módulo sigue **hexagonal + DDD**: `domain/` (entidades, value objects, reglas de negocio puras, sin dependencias de framework), `application/` (casos de uso, puertos), `infrastructure/` (adaptadores: Prisma, Redis, proveedores externos), `interface/` (controllers REST, resolvers, DTOs).

```
apps/api/src/
├── modules/
│   ├── iam/              # usuarios, auth, sesiones, passkeys, 2FA
│   ├── tenancy/          # organizations, workspaces, members, roles
│   ├── pages/            # páginas públicas, bloques, versionado (CQRS aquí)
│   ├── themes/           # temas, tokens de diseño
│   ├── analytics/        # eventos, agregaciones (CQRS + escritura async vía BullMQ)
│   ├── commerce/         # productos, pedidos, pagos (Fase B)
│   ├── workflows/        # motor de automatización (Fase C)
│   ├── plugins/          # registro e instalación de integraciones
│   ├── ai/               # capa de abstracción de proveedores IA + agentes (Fase D)
│   ├── billing/          # suscripciones, Stripe/Paddle
│   └── notifications/    # email, push, in-app
├── shared/
│   ├── kernel/           # tipos base de dominio (Entity, ValueObject, AggregateRoot)
│   ├── cqrs/             # bus de comandos/queries/eventos
│   └── guards/           # RBAC/ABAC, rate limiting
└── main.ts
```

**Regla dura:** un módulo nunca importa el `domain/` de otro módulo directamente. La comunicación entre módulos es vía **eventos de dominio** (bus interno, luego promovible a colas/eventos reales si se extrae a microservicio) o **puertos explícitos** inyectados. Esto es lo que hace viable extraer `analytics` o `workflows` como servicio aparte más adelante sin tocar el resto.

## 3. Por qué CQRS solo en `pages` y `analytics`

- `analytics`: los escritos (eventos de click/visita) son masivos y no necesitan consistencia fuerte; las lecturas (dashboard) son agregaciones pesadas. Separar el modelo de escritura (append-only, procesado en background con BullMQ) del de lectura (tablas agregadas/materializadas) evita que el dashboard compita por recursos con el tráfico de eventos en tiempo real.
- `pages`: publicar una página es una escritura poco frecuente pero cara (recalcular caché de edge, invalidar CDN); servir una página es una lectura extremadamente frecuente. Separar el "comando de publicar" de la "vista pública renderizada" permite cachear agresivamente la segunda sin acoplarla al modelo transaccional de bloques/versionado.
- El resto de módulos (iam, tenancy, billing) son CRUD con patrones de acceso normales — aplicar CQRS ahí sería complejidad sin beneficio.

## 4. Multi-tenancy: aislamiento de datos

- Toda tabla con datos de tenant lleva `workspace_id` obligatorio (no nullable, indexado).
- **Row-Level Security (RLS)** de PostgreSQL activada por tabla: cada conexión setea `SET app.current_workspace_id` al inicio de la request (middleware de Nest), y las políticas RLS filtran automáticamente. Esto da una segunda capa de defensa incluso si un desarrollador olvida el `WHERE workspace_id = ...` en una query.
- Resolución de tenant: subdominio (`usuario.linkforge.com`) o path (`linkforge.com/usuario`) o dominio custom verificado (tabla `Domain` con verificación DNS TXT) → todos resuelven a un `workspace_id` en middleware de edge antes de tocar el backend.

## 5. Frontend: dos superficies, un sistema de diseño compartido

```
apps/
├── web-app/     # Next.js — panel autenticado (dashboard, editor, analytics)
└── web-public/  # Next.js — renderer de páginas públicas (SSR/ISR, edge cache)
packages/
├── ui/          # Shadcn UI + componentes propios, Tailwind config compartida
├── block-renderer/  # renderer de bloques (usado por editor en modo preview Y por web-public)
└── contracts/   # tipos y esquemas Zod compartidos (DTOs de API)
```

`block-renderer` es el paquete clave: el editor en `web-app` lo usa para preview en tiempo real, y `web-public` lo usa para el render final. Un único renderer evita el bug clásico de "se ve distinto en el editor que publicado".

## 6. Editor visual — modelo de datos

Cada página es una lista ordenada de bloques, cada bloque es `{ id, type, order, config: JSON validado por Zod según type, version }`. El versionado guarda snapshots inmutables (`PageVersion`) para undo/redo e historial; "publicar" es copiar el snapshot de borrador a `publishedVersionId` y disparar invalidación de caché — no reescribe borrador ni publicado.

## 7. Sistema de IA — capa de abstracción

```
ai/
├── domain/ports/ (AiCompletionPort, AiImagePort)
├── infrastructure/adapters/
│   ├── openai.adapter.ts
│   ├── anthropic.adapter.ts
│   └── gemini.adapter.ts
└── application/use-cases/ (GenerateBio, SuggestSeo, RunAgent...)
```

Los casos de uso dependen del puerto, no del proveedor. La selección de proveedor/modelo es configuración (por costo, latencia o capacidad), no un cambio de código. Los "agentes" (Fase D) son casos de uso que orquestan varias llamadas al puerto + herramientas (function calling) + memoria (tabla `AgentSession` con historial acotado).

## 8. Sistema de plugins — arquitectura

- `PluginDefinition` (catálogo, código de proveedor, schema de config, permisos declarados) vs `PluginInstallation` (por workspace, config cifrada en reposo con clave por tenant, estado activo/inactivo).
- Cada plugin implementa una interfaz mínima según su categoría (`PaymentProvider`, `EmailProvider`, `AutomationTrigger`, `AnalyticsSink`) — el core nunca conoce a "Stripe" o "Mailchimp" directamente, conoce la interfaz. Esto es lo que permite añadir proveedores nuevos sin tocar el core, y es prerequisito para el marketplace de la Fase E.
- Permisos explícitos: un plugin declara qué datos necesita (ej. "email del visitante", "eventos de checkout") y el usuario los aprueba al instalar — mismo principio que permisos de apps OAuth.

## 9. Motor de workflows (Fase C)

Modelo: `Workflow { trigger, steps[] }`, ejecutado por un runner sobre BullMQ (colas + reintentos + backoff). Cada `step` es `condition | action | wait | loop`, ejecutado por un `StepExecutor` registrado por tipo (patrón similar a plugins). Los triggers se disparan por eventos de dominio internos (ej. `UserRegistered`) o webhooks entrantes. Esto reutiliza el mismo bus de eventos de dominio del punto 2 — el workflow engine es, en esencia, un consumidor más de esos eventos.

## 10. Infraestructura y despliegue

- **Cómputo:** Docker images para `api`, `web-app`, `web-public`, `worker` (BullMQ). Kubernetes-ready desde el día 1 (manifiestos + Helm chart), aunque el despliegue inicial puede ser más simple (ver plan de DevOps).
- **Datos:** PostgreSQL gestionado con réplicas de lectura para analytics; Redis para cache + colas; R2 para imágenes/archivos con CDN de Cloudflare delante.
- **Edge:** Cloudflare para DNS, cache de páginas públicas, WAF, rate limiting a nivel de borde.
- **CI/CD:** GitHub Actions — lint/test/build en cada PR, despliegue automático a staging en merge a `main`, despliegue a producción manual/aprobado. Terraform para la infraestructura (DNS, buckets, bases de datos gestionadas).
- **Observabilidad:** Sentry (errores), Prometheus + Grafana (métricas de sistema), logs estructurados centralizados, health checks por servicio.

## 11. Diagrama de arquitectura

(ver visual adjunto)
