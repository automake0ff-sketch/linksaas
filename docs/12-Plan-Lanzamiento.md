# LinkForge — Plan de ejecución para lanzamiento
**Rol:** CTO responsable del lanzamiento · **Fecha:** 14 de julio de 2026
**Objetivo:** convertir la auditoría en tareas ejecutables, priorizando velocidad de lanzamiento, generación de ingresos y corrección de riesgo real — no perfección técnica.

Nota antes de empezar: la auditoría no mencionó nada de **cobro**, y es la pieza que falta más grande de todas. No existe ninguna integración de Stripe/PayPal en el código (solo el modelo `Subscription` vacío en el esquema). Sin esto no hay ingresos, así que lo incorporo aquí como hallazgo propio, con la misma prioridad que un hallazgo crítico de seguridad — porque de nada sirve un backend seguro que no puede facturar.

---

## Hallazgos convertidos en tareas

Cada tarea sigue: Problema → Riesgo real → ¿Bloquea lanzamiento? → ¿Puede esperar? → Esfuerzo.

### T1 — Sin backups de base de datos
**Problema:** no hay backup automático configurado en ningún sitio.
**Riesgo real:** pérdida total e irreversible de datos de clientes ante cualquier fallo, borrado accidental o caída del proveedor.
**¿Bloquea lanzamiento?** Sí.
**¿Puede esperar?** No, es el único riesgo de esta lista con daño irreversible.
**Esfuerzo:** 1-4 horas (activar backups gestionados del proveedor + probar una restauración real).

### T2 — Base de datos y API en planes gratuitos de Render
**Problema:** `render.yaml` usa `plan: free` para BD y API.
**Riesgo real:** el plan gratuito de Render no ofrece backups automáticos, puede eliminar la BD por inactividad, y la API tiene cold starts (caída de disponibilidad percibida por el cliente).
**¿Bloquea lanzamiento?** Sí — es requisito previo de T1.
**¿Puede esperar?** No.
**Esfuerzo:** 1-4 horas (cambio de plan + validar variables de entorno tras el cambio).

### T3 — `CORS_ORIGINS` apunta a `localhost` en la config de despliegue real
**Problema:** `render.yaml` define los orígenes permitidos como `localhost:3000,localhost:3002`.
**Riesgo real:** el panel y la web pública en producción no podrán llamar a la API — el producto no funciona para ningún cliente real hasta corregirlo.
**¿Bloquea lanzamiento?** Sí, de forma literal (nada funciona sin esto).
**¿Puede esperar?** No.
**Esfuerzo:** Menos de 1 hora.

### T4 — `REDIS_URL` no está en las variables de entorno del despliegue real
**Problema:** el código ya soporta throttling distribuido vía Redis, pero `render.yaml` no lo conecta.
**Riesgo real:** con más de una instancia de la API, el rate limiting real se multiplica por el número de réplicas — puerta abierta a fuerza bruta y abuso a mayor escala de la prevista.
**¿Bloquea lanzamiento?** No para una sola instancia (lanzamiento pequeño). Sí en cuanto haya autoscaling.
**¿Puede esperar?** Sí, hasta Fase 2 si se lanza con una sola instancia.
**Esfuerzo:** Menos de 1 hora (aprovisionar Redis + variable de entorno).

### T5 — `SENTRY_DSN` no está en las variables de entorno del despliegue real
**Problema:** el SDK está instalado e inicializado condicionalmente, pero sin la variable, no reporta nada en producción.
**Riesgo real:** un error 500 con clientes reales no deja ningún rastro salvo logs de stdout sin estructurar — depuración a ciegas.
**¿Bloquea lanzamiento?** No técnicamente, pero es tan barato de arreglar que no tiene sentido lanzar sin ello.
**¿Puede esperar?** No merece la pena esperar.
**Esfuerzo:** Menos de 1 hora.

### T6 — Sin envío real de email (verificación + recuperación de contraseña)
**Problema:** no hay proveedor de email (Resend/SES) conectado; el registro auto-verifica la cuenta y el reset de contraseña no llega a nadie.
**Riesgo real:** un cliente que olvide su contraseña queda bloqueado sin salida — soporte manual obligatorio desde el primer incidente, y cualquiera puede registrarse con un email ajeno.
**¿Bloquea lanzamiento?** Sí para cualquier lanzamiento con clientes que no sean de máxima confianza.
**¿Puede esperar?** Podría posponerse solo si el lanzamiento es un piloto cerrado con 2-3 clientes conocidos personalmente y soporte manual del reset vía base de datos — no recomendable más allá de eso.
**Esfuerzo:** 4-8 horas (integración de proveedor + conectar los dos flujos que ya existen en el backend).

### T7 — Sin ninguna integración de cobro (Stripe/PayPal)
**Problema:** el modelo `Subscription` existe en el esquema pero no hay ningún código de facturación real.
**Riesgo real:** no hay forma de cobrar a un cliente de forma automática. Es el bloqueo directo de ingresos, no un riesgo técnico.
**¿Bloquea lanzamiento?** Depende del modelo de entrada: bloquea un self-service automatizado; **no bloquea** un lanzamiento con onboarding manual (factura o enlace de pago de Stripe gestionado a mano, marcando el plan del workspace manualmente en BD).
**¿Puede esperar?** La automatización completa sí puede esperar a Fase 2/3. El cobro en sí (aunque sea manual) no puede esperar si el objetivo es facturar desde el día 1.
**Esfuerzo:** Cobro manual con Payment Link de Stripe: menos de 1 hora de configuración. Integración automatizada completa (webhooks, gestión de plan, cancelación): más de 8 horas.

### T8 — Swagger (`/v1/docs`) expuesto sin protección en producción
**Problema:** se monta siempre, sin comprobar `NODE_ENV`.
**Riesgo real:** expone el mapa completo de la API a cualquiera; reconocimiento gratuito para un atacante. No es una fuga de datos directa.
**¿Bloquea lanzamiento?** No.
**¿Puede esperar?** No debería esperar mucho — es barato y reduce superficie de ataque.
**Esfuerzo:** Menos de 1 hora.

### T9 — Job de CI `deploy-staging` es un `echo`, sin CD real
**Problema:** no hay despliegue automatizado; todo despliegue a producción es manual.
**Riesgo real:** mayor probabilidad de error humano justo en el momento de más presión (el propio lanzamiento), y ningún despliegue reproducible ni auditable.
**¿Bloquea lanzamiento?** No técnicamente — se puede desplegar a mano una vez.
**¿Puede esperar?** Sí, para el primer lanzamiento. No debería esperar mucho más allá de eso.
**Esfuerzo:** Más de 8 horas (pipeline real de build+push+deploy con rollback).

### T10 — Sin tabla de refresh tokens ni revocación de sesión
**Problema:** un refresh token robado es válido 30 días sin forma de invalidarlo.
**Riesgo real:** sesión comprometida (dispositivo robado, token filtrado) no se puede cerrar de forma remota.
**¿Bloquea lanzamiento?** No para un piloto pequeño con pocos usuarios de confianza.
**¿Puede esperar?** Sí, pero no indefinidamente — es asumible hasta ~10-30 clientes, no más allá.
**Esfuerzo:** Más de 8 horas (tabla nueva, lógica de rotación con detección de reuso, migración).

### T11 — Flag de 2FA existe pero se ignora en login (funcionalidad fantasma)
**Problema:** si algún usuario activa 2FA (si la UI lo permite), el login no lo aplica — falsa sensación de seguridad.
**Riesgo real:** de producto/confianza, no de intrusión directa (peor percibido si el cliente se entera).
**¿Bloquea lanzamiento?** No, si se oculta de la UI. Sí, si se deja visible sin funcionar.
**¿Puede esperar?** El flujo completo sí. Ocultar el botón de activarlo, no.
**Esfuerzo:** Ocultar de la UI: menos de 1 hora. Implementar el flujo completo: más de 8 horas.

### T12 — Bloque tipo `html` en el editor sin renderer (funcionalidad fantasma)
**Problema:** existe como opción en el editor pero no se renderiza al publicar.
**Riesgo real:** confusión de usuario y tickets de soporte evitables. No hay riesgo de seguridad porque, al no renderizar, tampoco hay XSS.
**¿Bloquea lanzamiento?** No.
**¿Puede esperar?** Ocultarlo de la UI, no debería esperar (es barato). Implementarlo bien, sí puede esperar.
**Esfuerzo:** Ocultar de la UI: menos de 1 hora.

### T13 — Sin política de privacidad, términos de servicio ni consentimiento de cookies
**Problema:** no existe ninguno de los tres documentos/mecanismos legales en el repo.
**Riesgo real:** incumplimiento legal (RGPD) desde el primer usuario real en la UE, con multas potenciales y motivo de rechazo por parte de clientes B2B con su propio departamento legal.
**¿Bloquea lanzamiento?** Sí, para cualquier cliente real, no solo por riesgo — muchos clientes de pago simplemente no firman sin esto.
**¿Puede esperar?** No.
**Esfuerzo:** 4-8 horas (redactar con plantilla adaptada + implementar banner de cookies + enlazar en el registro).

### T14 — RLS no activo en `members` y `roles`
**Problema:** esas dos tablas dependen solo del guard de aplicación, no de una segunda capa a nivel de base de datos.
**Riesgo real:** un bug futuro en una query directa sobre esas tablas no tendría red de seguridad. Hoy no hay ningún bug conocido que lo explote.
**¿Bloquea lanzamiento?** No — es una decisión ya razonada y documentada por el propio equipo, no un descuido.
**¿Puede esperar?** Sí, con tranquilidad, hasta Fase 3.
**Esfuerzo:** Más de 8 horas (rediseño de política + segunda variable de sesión + migración).

### T15 — Sin logging estructurado
**Problema:** solo hay `console.log` puntual, sin niveles ni formato JSON ni request ID.
**Riesgo real:** cualquier incidente en producción se depura más lento de lo necesario.
**¿Bloquea lanzamiento?** No.
**¿Puede esperar?** Sí para el lanzamiento inicial, no mucho más allá — es la base de la que depende todo soporte serio.
**Esfuerzo:** 4-8 horas.

### T16 — Sin dashboards ni alertas de monitorización
**Problema:** solo existe el healthcheck `/v1/health` usado por Render.
**Riesgo real:** un incidente (caída de BD, saturación) se detecta cuando un cliente se queja, no antes.
**¿Bloquea lanzamiento?** No para los primeros clientes con seguimiento manual cercano.
**¿Puede esperar?** Sí, hasta Fase 2-3.
**Esfuerzo:** 4-8 horas (dashboard básico + un par de alertas críticas).

### T17 — Sin tests de autorización cross-tenant
**Problema:** solo hay cobertura de test en `workspace-access.guard.spec.ts`, no en todos los módulos.
**Riesgo real:** un bug de fuga de datos entre tenants no se detectaría antes de llegar a producción.
**¿Bloquea lanzamiento?** No si el guard actual ya se verificó manualmente (como indica la propia auditoría interna).
**¿Puede esperar?** Sí, hasta Fase 2.
**Esfuerzo:** 4-8 horas.

### T18 — Analítica pública escribe de forma síncrona sin cola
**Problema:** cada evento de tracking hace un `INSERT` directo, sin encolar.
**Riesgo real:** cuello de botella si el tráfico público crece — no afecta a los primeros clientes.
**¿Bloquea lanzamiento?** No.
**¿Puede esperar?** Sí, hasta Fase 3-4.
**Esfuerzo:** Más de 8 horas (worker + cola).

### T19 — `$executeRawUnsafe` en el endpoint de tracking
**Problema:** patrón frágil aunque hoy esté bien parametrizado.
**Riesgo real:** bajo hoy; alto si alguien lo modifica sin darse cuenta del riesgo.
**¿Bloquea lanzamiento?** No.
**¿Puede esperar?** Sí.
**Esfuerzo:** Menos de 1 hora.

### T20 — Falta bloqueo/backoff progresivo tras intentos fallidos de login
**Problema:** solo hay rate limit genérico (10/min), no bloqueo por cuenta.
**Riesgo real:** mitigación parcial de fuerza bruta, no protección real de cuenta individual.
**¿Bloquea lanzamiento?** No.
**¿Puede esperar?** Sí, hasta Fase 2.
**Esfuerzo:** 1-4 horas.

### T21 — Sin documento de "problemas conocidos" ni canal de soporte definido
**Problema:** no hay ningún proceso preparado para cuando un cliente reporte un problema.
**Riesgo real:** ninguno técnico, pero alto en percepción y retención si el primer incidente se gestiona con improvisación.
**¿Bloquea lanzamiento?** No, pero es tan barato que no tiene sentido no tenerlo.
**¿Puede esperar?** No merece la pena esperar.
**Esfuerzo:** Menos de 1 hora.

---

## FASE 1 — IMPRESCINDIBLE PARA LANZAR
*(Lo mínimo para aceptar el primer cliente de pago sin poner en riesgo sus datos ni el negocio)*

| # | Tarea | Esfuerzo |
|---|---|---|
| 1 | T3 — Corregir `CORS_ORIGINS` en `render.yaml` | <1h |
| 2 | T2 — Salir de planes gratuitos (BD + API) en Render | 1-4h |
| 3 | T1 — Activar backups automáticos y probar una restauración real | 1-4h |
| 4 | T4 — Conectar `REDIS_URL` en el despliegue | <1h |
| 5 | T5 — Conectar `SENTRY_DSN` en el despliegue | <1h |
| 6 | T8 — Restringir Swagger en producción | <1h |
| 7 | T11 (parcial) — Ocultar 2FA de la UI si está visible sin funcionar | <1h |
| 8 | T12 (parcial) — Ocultar el bloque HTML del editor | <1h |
| 9 | T7 (parcial) — Habilitar cobro manual (Payment Link de Stripe + marcar plan a mano en BD) | <1h |
| 10 | T13 — Política de privacidad + términos + consentimiento de cookies | 4-8h |
| 11 | T6 — Envío real de email (verificación + reset) | 4-8h |
| 12 | T21 — Documento de "problemas conocidos" + canal de soporte definido | <1h |
| 13 | Prueba manual end-to-end contra el stack real ya desplegado (registro → workspace → editor → publicar → pago manual) | 1-4h |

**Total estimado Fase 1: ~20-30 horas de trabajo efectivo**, repartibles en pocos días.

## FASE 2 — IMPRESCINDIBLE PARA LOS PRIMEROS 10 CLIENTES
*(Cuando ya no puedes vigilar cada sesión a mano)*

- T10 — Tabla de refresh tokens con revocación de sesión
- T20 — Bloqueo/backoff progresivo tras intentos fallidos de login
- T15 — Logging estructurado
- T16 — Dashboard básico + alertas críticas (caída de BD, tasa de error 5xx)
- T17 — Tests de autorización cross-tenant en todos los módulos
- T7 (completo) — Automatizar cobro real con webhooks de Stripe (gestión de alta/baja/impago sin intervención manual)
- T9 — Pipeline de CD real (build + push + deploy con rollback)

## FASE 3 — IMPRESCINDIBLE PARA LOS PRIMEROS 100 CLIENTES
*(Cuando el volumen empieza a exponer huecos de diseño, no solo de configuración)*

- T14 — RLS real en `members` y `roles`
- T18 — Cola asíncrona para analítica pública (evita cuello de botella de BD)
- T19 — Eliminar `$executeRawUnsafe` por cliente tipado
- Límites por plan aplicados de verdad a nivel de aplicación (páginas, miembros, dominios por plan)
- Implementación real del flujo de 2FA (activar lo que hoy está oculto)
- Separación de servicio para tráfico público vs. panel autenticado

## FASE 4 — ESCALADO
*(Cuando el crecimiento, no la supervivencia, es el problema)*

- CDN/cache para páginas públicas
- OAuth y passkeys
- Renderer seguro para el bloque HTML (con sanitización desde el mismo commit)
- Terraform/infra como código
- Tests de carga reales y ajuste de índices/particionado según tráfico observado

---

## Orden recomendado de trabajo

1. `render.yaml` (CORS, planes, variables de entorno) — despliegue y verificación inmediata
2. Backups + prueba de restauración
3. Swagger fuera de producción
4. Ocultar funcionalidad fantasma en el frontend (2FA, bloque HTML)
5. Cobro manual habilitado (Payment Link + marcar plan a mano)
6. Legal (privacidad, términos, cookies)
7. Módulo de email real (verificación + reset)
8. Prueba manual end-to-end completa contra producción real
9. Lanzamiento
10. (Post-lanzamiento inmediato, Fase 2) refresh tokens, logging, dashboard, CD real, Stripe automatizado

## Riesgos al modificar cada parte

- **`render.yaml`:** riesgo bajo, pero un cambio de plan de base de datos puede requerir migración de datos si ya hay datos de prueba — hacerlo antes de tener clientes reales, no después.
- **Módulo de email nuevo:** riesgo medio — toca dos flujos de autenticación ya funcionales (`forgot-password`, `register`); probar en staging antes de tocar producción, especialmente el caso de "email falla pero el registro no debe romperse".
- **Ocultar UI de 2FA/bloque HTML:** riesgo muy bajo, es solo frontend condicional.
- **Cobro (Stripe):** riesgo alto si se automatiza mal — un webhook mal manejado puede dejar a un cliente pagando sin acceso, o con acceso sin pagar. Empezar manual (Fase 1) reduce este riesgo hasta que haya tiempo de hacerlo bien (Fase 2).
- **Refresh tokens (tabla nueva):** riesgo alto — toca el corazón de la autenticación de todos los usuarios existentes; requiere migración cuidadosa y ventana de mantenimiento, no un despliegue en caliente sin aviso.
- **RLS en `members`/`roles`:** riesgo alto si se hace deprisa — el propio equipo ya advirtió que activarlo mal devuelve cero filas en una query legítima (listar mis workspaces). No tocar sin el rediseño completo ya documentado.

## Qué tareas pueden romper producción

- Cambiar el plan de base de datos de Render sin backup previo (T2 mal secuenciado)
- Activar RLS en `members`/`roles` sin el rediseño completo (T14) — puede dejar a todos los usuarios sin poder listar sus workspaces
- Migración de refresh tokens (T10) sin invalidar sesiones de forma controlada — puede desloguear a todos los usuarios a la vez si se hace mal
- Integración de Stripe automatizada (T7 completo) sin manejo idempotente de webhooks — puede duplicar cobros o revocar acceso de clientes que sí pagaron

## Qué tareas son rápidas y aportan mucho valor

- T3 (CORS) — sin esto nada funciona; 15 minutos de trabajo con impacto total
- T5 (Sentry) — una variable de entorno, pasa de "cero visibilidad" a "visibilidad real" de errores
- T8 (Swagger) — reduce superficie de ataque en minutos
- T11/T12 (ocultar funcionalidad fantasma) — evita tickets de soporte con cero riesgo técnico
- T9 (Payment Link manual) — habilita ingresos reales sin escribir una sola línea de integración compleja
- T21 (documento de problemas conocidos) — cero código, mucho ahorro de tiempo de soporte

---

## Si tuviera que lanzar LinkForge en 7 días, haría únicamente estas tareas:

1. Corregir `CORS_ORIGINS` en `render.yaml` a los dominios de producción reales
2. Salir de los planes gratuitos de Render (BD + API) y activar backups automáticos, con una restauración de prueba real
3. Conectar `REDIS_URL` y `SENTRY_DSN` en las variables de entorno del despliegue real
4. Restringir Swagger (`/v1/docs`) fuera de producción
5. Ocultar de la UI el toggle de 2FA y el bloque HTML del editor (funcionalidad no operativa)
6. Habilitar cobro manual con un Payment Link de Stripe y asignación manual del plan en base de datos
7. Publicar política de privacidad, términos de servicio y consentimiento de cookies
8. Implementar envío real de email para verificación de cuenta y recuperación de contraseña
9. Definir un canal de soporte y redactar el documento interno de "problemas conocidos"
10. Ejecutar una prueba manual completa del flujo real (registro → workspace → editor → publicar → cobro) contra el entorno de producción ya desplegado, antes de anunciar el lanzamiento

---

## Seguimiento de ejecución (actualizado por Claude tras esta sesión)

Progreso real de la Fase 1, con lo que se pudo hacer directamente vía código frente a lo que requiere una acción tuya (cuenta externa, panel de Render/Vercel):

- ✅ **T8** — Swagger ahora condicionado a `NODE_ENV !== 'production'`.
- ✅ **T19** — `$executeRawUnsafe` sustituido por el cliente tipado de Prisma (`analyticsEvent.create`).
- ✅ **T6** — Módulo `notifications` real: puerto `EmailPort`, adaptador Resend (HTTP directo) + adaptador no-op cuando falta la API key. Conectado a `forgot-password` (email real) y a un nuevo email de bienvenida en el registro. Añadidas las páginas de frontend que faltaban (`/forgot-password`, `/reset-password`) — el backend ya tenía los endpoints pero no había forma de usarlos desde la interfaz.
- ✅ **T21** — Este documento y `docs/13-Problemas-Conocidos.md`.
- ✅ **T11 (parcial)** — Verificado que el flag de 2FA no tiene ningún camino real para activarse hoy (no hay UI ni endpoint que lo ponga a `true`) — no había nada que ocultar, se documenta en vez de "arreglar" algo que no está expuesto.
- ✅ **T12 (parcial)** — Verificado que el bloque `html` nunca se añadió a la biblioteca de bloques del editor — ya estaba efectivamente oculto, no expuesto.
- 🟡 **T3, T4, T5** — `render.yaml` actualizado con los slots de `REDIS_URL`, `SENTRY_DSN`, `RESEND_API_KEY`, `EMAIL_FROM`, `FRONTEND_URL` (como `sync: false`, para rellenar a mano sin que Render los pise). **`CORS_ORIGINS` sigue apuntando a localhost — necesita las URLs reales de Vercel, pendientes de confirmar.**
- ⬜ **T1, T2** — Requieren cambiar de plan en el dashboard de Render (decisión de coste, no puede tomarse por código).
- ⬜ **T7** — Cobro manual: requiere una cuenta de Stripe real para generar el Payment Link.
- ⬜ **T13** — Legal (privacidad/términos/cookies): pendiente, ver siguiente sesión.
- ⬜ **T9, T10, T14-T20** — Fase 2/3, no bloquean el primer lanzamiento.
