# DevOps y plan de despliegue — LinkForge

## Entornos

`local` (Docker Compose) → `staging` (auto-desplegado en cada merge a `main`) → `production` (despliegue manual aprobado, mismo artefacto que pasó por staging — nunca se reconstruye para producción).

## Contenerización

- Imágenes Docker separadas para `api`, `web-app`, `web-public`, `worker`, cada una con build multi-stage (deps → build → runtime mínimo, sin devDependencies ni herramientas de build en la imagen final).
- `docker-compose.yml` para desarrollo local: Postgres, Redis, y los 4 servicios, con hot-reload.
- Manifiestos Kubernetes (Deployment, Service, HPA) desde el día 1, aunque el primer despliegue real puede ser más simple (ver decisión de hosting abajo) — así no hay que rediseñar cuando llegue el momento de escalar.

## Decisión de hosting inicial (justificada)

**No se lanza sobre Kubernetes desde el primer día.** Con tráfico inicial bajo/medio, la complejidad operativa de un clúster K8s no se justifica. Plan:
- `web-app` y `web-public` en Vercel (Next.js nativo, edge cache automático, cero configuración de infraestructura).
- `api` y `worker` en un servicio gestionado de contenedores (ej. Cloud Run / Fly.io / ECS Fargate) — escalado automático sin gestionar nodos.
- Migración a Kubernetes cuando el tráfico o la necesidad de control fino de recursos lo justifique — los manifiestos ya existen, así que la migración es operativa, no de diseño.

## CI/CD (GitHub Actions)

```
on: pull_request
  → lint, type-check, unit tests, integration tests, build

on: push a main
  → todo lo anterior
  → build de imágenes Docker, push a registry
  → deploy automático a staging
  → E2E contra staging
  → si todo pasa: artefacto queda "listo para producción" (requiere aprobación manual)

on: aprobación manual
  → deploy a producción (mismo artefacto, sin rebuild)
  → smoke tests post-deploy
  → rollback automático si smoke tests fallan
```

## Infraestructura como código

- Terraform para: DNS (Cloudflare), buckets R2, base de datos gestionada (Postgres), Redis gestionado, configuración de KMS/secretos.
- Estado de Terraform en backend remoto con locking, revisado en PR (plan de Terraform comentado automáticamente en el PR antes de aplicar).

## Observabilidad

- **Errores:** Sentry en frontend y backend, con source maps subidos automáticamente en CI para stack traces legibles.
- **Métricas:** Prometheus (métricas de aplicación: latencia por endpoint, tasa de error, tamaño de colas BullMQ) + Grafana (dashboards por servicio).
- **Logs:** estructurados (JSON), centralizados, correlacionados por `request_id` a través de todos los servicios (incluye workers async).
- **Health checks:** endpoint `/health` por servicio (liveness) y `/health/ready` (readiness, verifica conexión a DB/Redis) — usados tanto por Kubernetes como por el balanceador en el hosting inicial.

## Backups y recuperación

- Backups automáticos diarios de PostgreSQL con retención 30 días, backups adicionales antes de cada migración de esquema.
- Prueba de restauración trimestral (un backup que nunca se ha restaurado no es un backup confiable).
- RPO objetivo: 24h (backups diarios) en el lanzamiento inicial, evolucionable a point-in-time recovery cuando el volumen de datos lo justifique.

## Escalabilidad

- `web-public` cacheada agresivamente en el edge de Cloudflare → el 95%+ del tráfico público nunca toca el backend.
- `analytics_events` particionada por mes, con escritura desacoplada vía cola (BullMQ) para no bloquear el tráfico público en picos.
- Réplica de lectura de Postgres para queries de analítica pesadas, separada de la réplica primaria que atiende el tráfico transaccional.

---

## Cierre de la Fase 1 (planificación)

Con esto quedan completos los 10 documentos de planificación: PRD, Arquitectura, Base de Datos, Roadmap, Backlog, APIs, Diseño UI, Seguridad, Testing y DevOps.

**Siguiente paso natural:** implementar la **Fase 0 (Fundación)** — monorepo, CI/CD, auth y multi-tenant base — que es el primer módulo que debe quedar 100% funcional en producción antes de tocar el editor.
