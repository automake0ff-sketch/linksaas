# Roadmap — LinkForge

Estimaciones para un equipo pequeño (3-5 ingenieros full-stack + 1 diseñador), trabajando en sprints de 2 semanas. Cada fase termina con software desplegado en producción, no solo "código terminado".

| Fase | Contenido | Duración estimada | Criterio de salida |
|---|---|---|---|
| **0. Fundación** | Monorepo, CI/CD, entornos (dev/staging/prod), auth completa, multi-tenant base, esquema de BD inicial | 3 sprints (~6 sem) | Un usuario puede registrarse, crear un workspace y ver un dashboard vacío en producción |
| **A. MVP** | Editor de bloques, temas, página pública SSR con SEO técnico, analítica básica, publicar/despublicar | 5 sprints (~10 sem) | Un usuario crea su página, la publica en `slug.linkforge.com`, y ve visitas reales en el dashboard |
| **B. Comercio** | Productos, checkout Stripe, reservas simples, donaciones | 4 sprints (~8 sem) | Un usuario vende un producto digital y recibe el pago |
| **C. Automatización** | Workflow builder, sistema de plugins (5-6 integraciones iniciales), webhooks | 5 sprints (~10 sem) | Un usuario crea un workflow "nuevo pedido → email" sin escribir código |
| **D. IA** | Asistente de panel, generación de bio/copy/SEO, primer agente (SEO) | 4 sprints (~8 sem) | El asistente genera una página completa a partir de una descripción en 1 prompt |
| **E. Plataforma abierta** | Marketplace de plugins/temas, white-label, API pública | 6 sprints (~12 sem) | Un tercero publica un plugin en el marketplace sin intervención del equipo core |

**Total hasta MVP comercialmente defendible (Fase A):** ~16 semanas desde cero.
**Total hasta diferenciación real frente a Liinks (Fases A+B+C):** ~34 semanas.

## Hitos de negocio asociados

- **Fin de Fase A:** apertura de waitlist pública / beta cerrada.
- **Fin de Fase B:** lanzamiento público, plan de pago activo.
- **Fin de Fase C:** campaña de posicionamiento "la única bio-link con automatización real".
- **Fin de Fase D:** IA como palanca de retención (onboarding asistido, reactivación).
- **Fin de Fase E:** apertura de programa de partners/agencias.

## Dependencias críticas entre fases

- B depende de A (necesita página pública funcionando para insertar checkout).
- C depende de A (el bus de eventos de dominio se diseña en Fase 0 pero se explota en C).
- D puede empezar en paralelo a C si hay equipo suficiente (módulo `ai` es independiente).
- E depende de C (el marketplace de plugins reutiliza la arquitectura de plugins de C).
