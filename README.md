# LinkForge

Plataforma de bio-links, comercio y automatización. Ver `docs/` para el PRD,
arquitectura, base de datos, roadmap, backlog, APIs, seguridad, testing y
DevOps completos.

## Estado actual: Fase 0 (Fundación) — en progreso

Implementado en este incremento:
- Monorepo (npm workspaces) con `apps/api`, `apps/web-app`, `apps/web-public`, `packages/`.
- Esquema Prisma completo de identidad, tenancy y páginas base (comercio/workflows/plugins llegan en Fase B/C).
- Módulo `iam` con arquitectura hexagonal completa: dominio puro (`User` entity con reglas de negocio y eventos), puertos, casos de uso (`RegisterUser`, `LoginUser`), adaptadores Prisma + Argon2id + JWT, controller REST con rate limiting y cookies httpOnly.
- Middleware de resolución de tenant + guard RBAC/ABAC (`WorkspaceAccessGuard`) que verifica membresía real en BD, no solo el header.
- Bus de eventos de dominio compartido entre módulos (comunicación desacoplada).
- Validación de variables de entorno con Zod (falla al arrancar si falta algo crítico).
- Seguridad de base: Helmet con CSP, CORS explícito, rate limiting global + por endpoint.
- Docker Compose para desarrollo local, Dockerfile multi-stage para producción.
- CI en GitHub Actions (lint, test, build, migraciones contra Postgres real).
- Tests unitarios de dominio y de caso de uso (patrón a replicar en cada módulo siguiente).

Además, en este incremento:
- Módulo `tenancy` completo: entidad `Workspace` (validación de slug, slugs reservados), casos de uso `CreateWorkspace` e `InviteMember`, adaptadores Prisma.
- Listener `CreateDefaultWorkspaceOnRegister`: al emitirse `user.registered`, `tenancy` crea automáticamente la organización y el primer workspace — **sin que `iam` conozca la existencia de `tenancy`**, solo por el bus de eventos.
- Guard JWT global (`PublicAuthGuard`, "secure by default": toda ruta requiere token salvo que se marque `@Public()` explícitamente).
- Seed de roles de sistema (`owner`, `admin`, `editor`, `viewer`) con permisos ABAC.
- **`web-app`**: layout con sistema de tipografía propio (Space Grotesk/Inter/JetBrains Mono), tokens de color claro/oscuro, páginas de registro/login con React Hook Form + Zod conectadas a la API real, shell de dashboard con el conmutador de workspace (elemento de firma visual).
- **`web-public`**: página `[slug]` con SSR, metadata dinámica (OpenGraph, Twitter Cards, JSON-LD Schema.org), `robots.ts`/`sitemap.ts`, renderer de bloques (link/text/social/image), beacon de analítica de vista.
- **API**: endpoints públicos de solo lectura (`GET /public/pages/:slug`, `POST /public/events`) que conectan `web-public` de extremo a extremo con la base de datos real.
- `packages/contracts`: esquemas Zod compartidos (bloques, tema, auth) entre las tres piezas — un solo punto de verdad para estas formas de datos.

## Pendiente para cerrar Fase 0 / avanzar Fase A (próximos incrementos)

- OAuth (Google/GitHub/Apple) y Magic Links — adaptadores adicionales sobre el mismo puerto `AuthMethodRepositoryPort`.
- Passkeys (WebAuthn) — ya modelado en el esquema (`credential_public_key`, `credential_counter`).
- 2FA (TOTP) — completar `VerifyTwoFactorUseCase` (el login ya detecta `requiresTwoFactor`).
- Invitación de miembros que aún no tienen cuenta (tabla `workspace_invitations` + email).
- `RefreshTokenUseCase` con rotación y detección de reuse.
- Editor visual drag&drop en `web-app` (Fase A) — hoy hay un placeholder en `/dashboard`.
- `avatarUrl`/`bio` en el modelo `Page` (hoy el endpoint público los devuelve como `null` — falta el campo en Prisma).
- Extraer `BlockRenderer` a `packages/block-renderer` cuando el editor lo necesite también para preview en vivo (mismo renderer en ambas apps, ver docs/02-Arquitectura.md §5).
- Migración inicial de Prisma aplicada + políticas RLS generadas por script (una por tabla con `workspace_id`).

## Cómo correr en local

```bash
cp .env.example .env                        # raíz: variables de la API
cp apps/web-app/.env.example apps/web-app/.env.local
cp apps/web-public/.env.example apps/web-public/.env.local
# genera un JWT_SECRET real: openssl rand -base64 48

npm install
docker compose up -d postgres redis
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed          # roles de sistema (owner/admin/editor/viewer)

npm run dev:api              # http://localhost:3001/v1  — docs en /v1/docs
npm run dev:web-app          # http://localhost:3000      — panel
npm run dev:web-public       # http://localhost:3002      — páginas públicas
```

## Estructura

```
apps/
  api/          NestJS — monolito modular (hexagonal + DDD + CQRS selectivo)
  web-app/      Next.js — panel autenticado (pendiente de scaffolding)
  web-public/   Next.js — páginas públicas SSR/ISR (pendiente de scaffolding)
packages/
  contracts/    Tipos y esquemas Zod compartidos entre apps
prisma/
  schema.prisma Esquema único de base de datos
docs/           Los 10 documentos de la Fase 1 (PRD, arquitectura, etc.)
```

## Principios de arquitectura aplicados en el código

- Cada módulo de `api/src/modules/*` sigue `domain/ → application/ → infrastructure/ → interface/`. El dominio nunca importa Nest, Prisma ni ninguna librería externa.
- Los módulos se comunican solo por eventos de dominio (`DomainEventBus`), nunca importando el `domain/` de otro módulo.
- Todo caso de uso depende de puertos (interfaces), nunca de un adaptador concreto — ver `iam.module.ts` para el cableado de inyección de dependencias.
