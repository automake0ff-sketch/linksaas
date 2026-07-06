# Estrategia de testing — LinkForge

## Pirámide de tests

```
        E2E (Playwright)          ← pocos, flujos críticos de negocio
    Integración (Vitest + DB test) ← por módulo, casos de uso reales
Unit (Vitest)                     ← muchos, rápidos, dominio puro
```

**Objetivo de cobertura: ≥ 90% en `domain/` y `application/`** (lógica de negocio pura, la parte que más vale la pena proteger). No se persigue 90% en `infrastructure/` (adaptadores finos a librerías externas) ni en componentes puramente visuales — cobertura ahí es teatro, no protección real.

## Unit tests

- Cada entidad y value object del dominio: reglas de negocio (ej. "un workflow no puede tener un trigger sin al menos un step", "un slug de workspace debe ser único y cumplir regex").
- Cada caso de uso (`application/`): mockeando los puertos (repositorios, proveedores externos), verificando la orquestación y los efectos secundarios esperados (eventos emitidos).
- Herramienta: Vitest (rápido, compatible con el resto del stack TS).

## Integration tests

- Por módulo, contra una base de datos de test real (contenedor Postgres efímero vía Testcontainers), no mocks de Prisma — los bugs de RLS y constraints solo se detectan contra Postgres real.
- Casos obligatorios por módulo con datos de tenant: aislamiento entre workspaces (test que intenta cruzar datos y espera 403/404).
- Contratos de API: tests que validan que la respuesta cumple el schema Zod/OpenAPI publicado (evita romper el contrato sin darse cuenta).

## E2E (Playwright)

Flujos críticos cubiertos desde la Fase A, ampliados en cada fase siguiente:

1. Registro → verificación de email → crear workspace → publicar primera página.
2. Login con OAuth y con passkey.
3. Editor: añadir bloque, reordenar, deshacer, publicar, ver la página pública resultante.
4. (Fase B) Checkout completo de un producto digital con tarjeta de test de Stripe.
5. (Fase C) Crear un workflow, disparar el trigger, verificar que la acción se ejecuta.
6. Invitar a un miembro, verificar permisos por rol (un "viewer" no puede editar).

Playwright corre contra un entorno de staging real (no mocks) en cada despliegue a staging, bloqueando el pase a producción si falla.

## Tests no funcionales

- **Carga:** k6 contra endpoints críticos (checkout, publicar página, servir página pública) antes de cada release mayor — objetivo p95 < 300ms en API, < 1.2s LCP en página pública bajo carga simulada.
- **Seguridad:** escaneo SAST en CI (ej. Semgrep), dependency scanning (Dependabot/Snyk), pentest externo antes del lanzamiento público (fin de Fase B) y anualmente después.
- **Accesibilidad:** axe-core automatizado en CI sobre las pantallas principales del panel.

## Política de CI

- Ningún PR se mergea sin: lint, type-check, unit + integration tests en verde, cobertura no decreciente en `domain/application`.
- E2E corre en cada merge a `main` (contra staging desplegado automáticamente) — un fallo bloquea el despliegue a producción, no solo avisa.
