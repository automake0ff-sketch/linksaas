# PRD — LinkForge (nombre de trabajo)
### Plataforma de bio-links, comercio y automatización premium
**Versión:** 1.0 · **Autor:** CTO/Equipo de producto · **Fecha:** Julio 2026

---

## 1. Resumen ejecutivo

Liinks, Linktree y Beacons resuelven "un link en la bio". Ninguno resuelve bien **tres cosas a la vez**: comercio nativo (vender sin salir de la página), automatización real (workflows tipo Zapier integrados) y una capa de IA que actúe, no solo que redacte texto.

**Posicionamiento:** *"Tu página de enlaces, pero que vende, automatiza y aprende sola."*

No competimos en "más iconos de redes sociales". Competimos en:
1. **Comercio integrado** (productos, reservas, suscripciones) sin plugins de terceros mal pegados.
2. **Automatizaciones nativas** (workflow builder) — nadie en esta categoría lo tiene bien resuelto hoy.
3. **Agentes IA operativos** dentro del panel (no un chatbot decorativo).

## 2. Objetivos de negocio

| Objetivo | Métrica | Horizonte |
|---|---|---|
| Validar PMF | 500 workspaces activos, 40% WAU/MAU | Mes 3 post-lanzamiento |
| Monetización | Conversión free→paid ≥ 4% | Mes 6 |
| Retención | Churn mensual < 5% en plan Pro | Mes 6 |
| Rendimiento | LCP < 1.2s en páginas públicas, TTFB < 200ms | Desde MVP |

## 3. Usuarios objetivo (personas)

- **Creador individual** (influencer, freelancer): quiere verse profesional, vender productos digitales/afiliados, sin saber de código.
- **Pequeño negocio/equipo**: necesita marca, roles, reservas y facturación.
- **Agencia**: gestiona múltiples workspaces de clientes, necesita white-label y permisos granulares.

## 4. Alcance por fases (evita "big bang")

**MVP (Fase A — 100% funcional antes de seguir):**
- Auth completa (OAuth, magic link, passkeys, 2FA)
- Multi-tenant (workspaces, roles)
- Editor visual drag&drop con bloques básicos (link, texto, imagen, redes, embed)
- Temas (claro/oscuro, colores, fuentes)
- Analítica básica (visitas, clicks, países, referer)
- Página pública con SSR + SEO técnico completo
- Panel de administración de bloques y publicación (borrador/publicado)

**Fase B — Comercio:**
- Productos digitales/físicos simples, checkout con Stripe
- Reservas/Calendly-like
- Donaciones

**Fase C — Automatización:**
- Workflow builder (trigger → condición → acción)
- Integraciones vía sistema de plugins (Stripe, Mailchimp, Slack, webhooks, Zapier/Make)

**Fase D — IA:**
- Asistente de panel (genera bio, copy, CTA, sugerencias SEO)
- Agentes especializados (SEO, marketing, atención al cliente)

**Fase E — Plataforma abierta:**
- Marketplace de plugins/temas
- White-label para agencias
- API pública + SDK

> Justificación de orden: sin Fase A no hay producto vendible. Comercio (B) genera ingresos antes que automatización (C), que es diferenciador pero no imprescindible para el primer euro. IA (D) es mejor como *retención* que como gancho inicial: sin volumen de usuarios reales, los agentes no tienen contexto suficiente para ser útiles. Marketplace (E) requiere ecosistema ya activo.

## 5. Requisitos no funcionales (no negociables desde el día 1)

- **Seguridad:** OWASP Top 10, RBAC + ABAC, rate limiting, CSRF/XSS/CSP, cifrado en reposo y tránsito, rotación de secretos, auditoría de accesos.
- **Rendimiento:** páginas públicas cacheadas en edge (Cloudflare), server components donde no haya interactividad, presupuesto de JS < 100kb en la página pública.
- **Escalabilidad:** monolito modular con límites de módulo claros (DDD/hexagonal) para poder extraer microservicios (ej. analytics, workflow engine) sin reescritura.
- **Multi-tenant:** aislamiento lógico por `workspace_id` en cada tabla desde el primer día (evita migración dolorosa después).
- **Cobertura de tests:** ≥ 90% en dominio y casos de uso; E2E de los flujos críticos (registro, publicación, checkout).
- **Cumplimiento:** GDPR (exportar/eliminar datos), facturación con IVA por región.

## 6. Decisiones de arquitectura clave (y por qué)

| Decisión | Alternativa descartada | Motivo |
|---|---|---|
| Monolito modular (DDD) en vez de microservicios desde el día 1 | Microservicios completos | Con equipo/etapa inicial, la complejidad operativa de N servicios no se justifica; se diseñan los módulos con límites claros para extraer después (analytics y workflow-engine son los primeros candidatos). |
| CQRS solo en módulos con lectura/escritura muy asimétrica (analytics, feed público) | CQRS global | Aplicarlo a todo el sistema añade complejidad sin beneficio en módulos CRUD simples (perfil, temas). |
| PostgreSQL con Row-Level Security por `workspace_id` | Esquema por tenant / DB por tenant | RLS da aislamiento fuerte sin la complejidad operativa de miles de esquemas o bases de datos a partir de cierta escala. |
| Editor: bloques como JSON versionado en Postgres (no HTML libre) | Editor basado en HTML/CSS libre | JSON estructurado permite versionado, undo/redo, render seguro (sin XSS) y reutilización en distintos temas. |
| Workflow engine propio sobre BullMQ (Fase C) | Depender solo de Zapier/Make | Es el diferenciador del producto; no se puede tercerizar el core value. Sí se integra con Zapier/Make como *canal adicional*, no como motor. |
| IA: proveedor-agnóstico vía capa de abstracción (OpenAI/Anthropic/Gemini intercambiables) | Atarse a un solo proveedor | Precio y disponibilidad de modelos cambia rápido; la capa de abstracción cuesta poco y evita lock-in. |

## 7. Modelo de datos — entidades núcleo (conceptual)

```
Organization ──< Workspace ──< Member (User + Role)
Workspace ──< Page ──< Block (tipo, orden, config JSON, versión)
Workspace ──< Theme
Workspace ──< Domain (subdominio o dominio custom)
Page ──< AnalyticsEvent (particionado por fecha)
Workspace ──< Product ──< Order ──< Payment
Workspace ──< Workflow ──< WorkflowRun ──< WorkflowStep
Workspace ──< PluginInstallation (plugin_key, config cifrado)
User ──< AuthMethod (oauth/passkey/magic-link)
```

(El esquema físico completo con tipos, índices y constraints se entrega en la Fase 2 — Base de Datos.)

## 8. Métricas de éxito del producto

- **Activación:** % de usuarios que publican su página en los primeros 10 minutos.
- **Engagement:** bloques añadidos por workspace/semana.
- **Monetización:** GMV procesado a través de la plataforma (Fase B en adelante).
- **Automatización:** workflows activos por workspace (Fase C).

## 9. Riesgos principales

| Riesgo | Mitigación |
|---|---|
| Alcance excesivo (feature creep) frente a MVP vendible | Congelar Fase A, no tocar Fase B/C hasta A esté 100% funcional en producción |
| Costos de IA impredecibles | Rate limiting por plan, caché de respuestas, modelos más baratos para tareas simples |
| Complejidad multi-tenant mal diseñada desde el inicio | RLS + `workspace_id` obligatorio desde el primer commit, tests de aislamiento entre tenants |
| Plugins de terceros como vector de ataque | Sandboxing de config, permisos explícitos por plugin, revisión antes de publicar en marketplace |

---

## Próximos documentos de la Fase 1 (planificación, aún sin código)

1. ✅ PRD (este documento)
2. Arquitectura detallada + diagramas
3. Esquema de base de datos (DDL completo)
4. Roadmap con hitos temporales
5. Backlog de épicas e historias de usuario
6. Especificación de APIs (REST/GraphQL, contratos)
7. Diseño UI (sistema de diseño, wireframes clave)
8. Plan de seguridad
9. Estrategia de testing
10. Plan de DevOps y despliegue
