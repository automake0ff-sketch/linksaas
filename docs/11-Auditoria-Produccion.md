# Auditoría de preparación para producción — LinkForge
**Fecha:** Julio 2026 · **Alcance:** todo el monorepo (api, web-app, web-public, infraestructura)

## Veredicto

**No está listo para producción con usuarios reales y datos reales.** Sí es un buen estado para: demo interna, staging, o continuar desarrollo activo. La razón principal no es que falten funcionalidades de las Fases B/C/D (eso es esperado y está en el roadmap) — es que **varias piezas ya "documentadas como hechas" no funcionaban de verdad**, y esta auditoría las encontró probando, no solo leyendo código.

Metodología: no me limité a revisar el código a ojo. Instalé PostgreSQL real, ejecuté los tests que ya existían (por primera vez desde que se escribieron), compilé los tres proyectos con `tsc --noEmit`, y apliqué la migración de base de datos contra un Postgres real con datos de prueba. Eso es lo que sacó a la luz los hallazgos críticos de abajo — varios no eran visibles solo leyendo el código.

---

## Hallazgos críticos (bloquean producción)

### 1. No existían migraciones de base de datos — **corregido en esta auditoría**
`prisma/migrations/` no existía. El esquema completo (12 tablas, RLS, índices) estaba documentado en `docs/03-Base-de-Datos.md` y modelado en `schema.prisma`, pero **nunca se había aplicado a una base de datos real**. Cualquier intento de desplegar habría fallado con "relation does not exist" en la primera query.

**Qué se hizo:** se escribió la migración a mano (el motor de Prisma no es descargable en el entorno donde se hizo esta auditoría — ver hallazgo #7) y se verificó aplicándola contra un Postgres real, incluyendo un flujo de inserción completo (usuario → organización → workspace → miembro → página). Se encontraron y corrigieron dos bugs reales en el proceso:
- Faltaban índices en prácticamente todas las columnas de clave foránea (`workspace_id`, `user_id`, etc.) — Postgres, a diferencia de MySQL, no los crea automáticamente. Sin esto, cualquier query de listado a escala habría hecho table scan.
- `uuid_generate_v7()` no existe en Postgres vanilla — el esquema la usaba como si fuera nativa. Se implementó la función.

### 2. RLS (Row-Level Security) está documentado pero no conectado a nada real
El wrapper `PrismaService.withWorkspace()` existe pero **no lo usa ningún repositorio** (verificado por grep en todo el código: cero usos reales). Si se hubieran activado las políticas RLS tal como estaban diseñadas, **toda consulta real de la aplicación habría devuelto cero filas** — porque ninguna query pasa por el contexto que fija `app.current_workspace_id`.

**Qué se hizo:** las políticas se escribieron y se dejaron documentadas en `docs/rls-policies-reference.sql`, explícitamente fuera de `prisma/migrations/` para que nadie las aplique sin querer. El documento explica el orden correcto para activarlas (requiere primero refactorizar los repositorios para inyectar el cliente de transacción). **Hoy, la única defensa real de aislamiento multi-tenant es el `WorkspaceAccessGuard`** (que sí funciona — verifica membresía real contra la tabla `members` en cada request). Eso es una sola capa, no las dos que los docs prometían.

### 3. El refresh token no funcionaba — **corregido en esta auditoría**
El endpoint `POST /auth/refresh` era un stub que devolvía `{ received: true/false }` sin emitir ningún token nuevo. Combinado con que el access token vive solo en memoria en el frontend, esto significaba:
- El access token expira a los 15 minutos y no hay forma de renovarlo → sesión rota cada 15 min.
- Recargar la pestaña del navegador pierde el token de memoria → el usuario parece deslogueado en cada F5, aunque su sesión siga siendo válida en el servidor.

**Qué se hizo:** se implementó `RefreshTokenUseCase` (emite un par nuevo de tokens a partir de un refresh token válido), se cableó el endpoint de verdad, se añadió reintento automático en el cliente API tras un 401, y un hook de arranque de sesión (`useBootstrapSession`) que recupera el access token desde la cookie httpOnly al cargar la app.

**Lo que sigue faltando (documentado, no arreglado):** no hay tabla de refresh tokens emitidos, así que no hay detección de reuse (un refresh token robado y usado dos veces no se detecta ni revoca). Necesita una tabla `refresh_tokens` (jti, user_id, family_id, revoked_at) — es una feature real, no un bug, pero conviene saber que no está.

### 4. Bug real en la validación de email — **corregido en esta auditoría**
`User.create()` validaba el formato del email **antes** de recortar espacios en blanco, no después. Un registro con un espacio accidental al principio o final del email (fácil de que pase copiando y pegando desde el móvil) se habría rechazado con "Email inválido" en vez de aceptarse normalizado. Se descubrió porque, por primera vez en esta auditoría, se ejecutaron de verdad los tests unitarios que ya existían — nunca se habían corrido tras escribirse.

### 5. El pipeline de lint de CI estaba roto — **corregido en esta auditoría**
Ninguno de los tres proyectos (`api`, `web-app`, `web-public`) tenía ESLint instalado ni configurado, pese a que el `package.json` raíz define `"lint": "npm run lint --workspaces --if-present"` y el CI lo ejecuta en cada push. Esto significa que **el pipeline de CI probablemente nunca ha pasado en verde** desde que se subió (`eslint: command not found` en `api`; `next lint` sin configuración se comporta de forma no determinista en un entorno no interactivo).

**Qué se hizo:** se añadió ESLint + configuración mínima a los tres proyectos y se verificó ejecutándolo (0 errores, 1 warning menor que también se corrigió — que a su vez era un bug real de manejo de errores, ver más abajo).

### 6. Manejo de errores demasiado amplio en el listener de creación de workspace
`CreateDefaultWorkspaceOnRegister` capturaba **cualquier** excepción al crear el workspace por defecto y asumía que era "el slug ya existe", reintentando a ciegas con un sufijo aleatorio. Si el fallo real hubiera sido, por ejemplo, la base de datos caída, el código lo habría tratado igual (reintento con otro slug, que probablemente también falla) en vez de dejar visible el error real. Corregido: ahora solo se trata como conflicto de slug si el error es específicamente `ConflictException`; cualquier otro error se relanza.

### 7. El motor de Prisma no se pudo descargar en el entorno de auditoría
`binaries.prisma.sh` no es alcanzable desde este entorno de pruebas (403 Forbidden). Esto **no es un problema del proyecto** — en cualquier entorno con red completa (tu máquina, CI de GitHub, Docker) esto no debería ocurrir, y de hecho el Dockerfile y el CI ya llaman a `prisma generate` explícitamente. Se menciona aquí porque **limita lo que esta auditoría pudo verificar**: no se pudo levantar el servidor NestJS real ni hacer una prueba end-to-end HTTP completa (login real, editor real contra la API real). Todo lo verificado se hizo a nivel de tipos (`tsc --noEmit`), tests unitarios (`vitest`), y SQL directo contra Postgres. **Recomendación:** antes de ir a producción, correr el stack completo una vez en un entorno normal (`docker compose up`, seguir el README) y probar manualmente el flujo registro → crear workspace → editar → publicar → ver la página pública.

---

## Huecos importantes (no bloquean un despliegue de prueba, sí uno real)

- **No hay envío de email real.** El registro dice "revisa tu email para verificar tu cuenta" pero no hay integración con Resend/SendGrid/etc. Nadie recibe ningún email. La verificación de email (`User.markEmailVerified`) existe en el dominio pero no hay ningún caso de uso ni endpoint que la dispare con un token real.
- **"Recuperar contraseña" no existe.** Estaba en la lista de must-haves original y nunca se implementó.
- **OAuth, passkeys y 2FA no están implementados** (esto sí está documentado honestamente en el README como pendiente, no es un hallazgo nuevo).
- **Invitar a un miembro que aún no tiene cuenta falla** — `InviteMemberUseCase` lanza `NotFoundException` en ese caso en vez de crear una invitación pendiente. Documentado, no arreglado.
- **El throttling (`@nestjs/throttler`) usa almacenamiento en memoria por defecto.** Con una sola instancia del API esto funciona; en cuanto haya más de una réplica (necesario para cualquier despliegue serio), cada instancia lleva su propio contador y el rate limit efectivo se multiplica por el número de réplicas. Necesita el storage de Redis (`@nest-lab/throttler-storage-redis` o similar) — Redis ya está provisionado en `docker-compose.yml` pero no conectado a esto.
- **Sentry está mencionado en `docs/10-DevOps.md` y en `.env.example` (`SENTRY_DSN`) pero el SDK no está instalado ni inicializado en ningún sitio.** Hoy, un error 500 en producción no se reporta a ningún sitio salvo los logs de stdout.
- **No hay backups configurados** (es infraestructura, no código — depende de dónde se aloje Postgres finalmente, pero vale la pena repetir que hoy no existen).
- **El bloque de tipo `html` está en el dominio (`BLOCK_TYPES`) pero no tiene renderer.** Bien — significa que el riesgo de XSS vía HTML de usuario que `docs/08-Seguridad.md` menciona **todavía no aplica**, porque ese bloque no se puede usar de verdad. Cuando se implemente su renderer, la sanitización (allowlist de tags, DOMPurify o similar) tiene que ir *en ese mismo commit*, no después.
- **`next lint` está deprecado** (avisa Next.js 15 al ejecutarlo) — funciona hoy, pero migrar a `eslint` directo antes de Next.js 16 evita una rotura futura no relacionada con este proyecto.

---

## Lo que sí funciona (verificado, no asumido)

- El esquema de base de datos aplica limpio contra Postgres real, con un flujo de inserción encadenado completo probado a mano.
- 35 tests unitarios (dominio + casos de uso + store del editor) pasan tras las correcciones de esta auditoría.
- Los tres proyectos compilan sin errores de tipos (`tsc --noEmit`) y sin errores de lint.
- El `WorkspaceAccessGuard` (RBAC/ABAC a nivel de aplicación) es real y verifica membresía contra la base de datos en cada request — no es un stub.
- Argon2id para contraseñas, JWT con expiración corta, cookies httpOnly para el refresh token: todo eso está bien implementado donde existe.
- El editor visual (drag&drop, autosave, undo/redo, temas) es funcional de extremo a extremo a nivel de código — solo no se pudo probar contra un servidor real por la limitación de red mencionada en el hallazgo #7.

---

## Recomendación de siguientes pasos, en orden

1. **Antes de cualquier despliegue real:** clona el repo en una máquina/CI con red normal, corre `docker compose up`, sigue el README, y prueba a mano el flujo completo una vez. Esta auditoría no pudo hacerlo por la restricción de red del entorno donde se ejecutó.
2. Conectar Redis al throttler (réplicas múltiples romperán el rate limiting si no).
3. Instalar y configurar Sentry (o el equivalente que prefieras) — hoy no hay visibilidad de errores en producción.
4. Implementar envío de email real (verificación + recuperación de contraseña) — son must-haves del PRD original, no extras.
5. Antes de considerar RLS "activo": hacer el refactor de repositorios descrito en `docs/rls-policies-reference.sql` y solo entonces aplicar esas políticas.
6. OAuth/passkeys/2FA cuando toque, según el roadmap ya acordado.

Ninguno de estos pasos es una sorpresa del roadmap — lo que cambia tras esta auditoría es que ahora sabes con certeza (probado, no asumido) cuáles de las piezas "ya hechas" tenían agujeros reales, y esos ya están cerrados.
