# Problemas conocidos — LinkForge

Última actualización: julio 2026. Este documento existe para que, cuando llegue el primer ticket de soporte, la respuesta sea "sí, lo sabemos, está en el roadmap" en vez de sorpresa e improvisación.

## Canal de soporte

- **Email de soporte:** _(definir antes de lanzar — ej. soporte@tudominio.com)_.
- **Tiempo de respuesta objetivo:** _(definir — ej. 24h laborables para un piloto pequeño)_.
- **Qué hacer ante un incidente:** revisar Sentry (si está conectado) → revisar logs de Render → si afecta a un cliente concreto, responder primero con "lo estamos mirando" antes de tener la causa raíz.

## Limitaciones conocidas (no son bugs, son alcance no implementado todavía)

- **No hay recuperación de contraseña por email hasta configurar `RESEND_API_KEY`.** Sin esa variable en el despliegue, el flujo de "olvidé mi contraseña" no envía nada (queda registrado en los logs del servidor, no llega al usuario).
- **No hay 2FA real.** La opción no aparece en la interfaz porque no existe ningún flujo para activarlo — no es un fallo de seguridad activo, simplemente no está construido.
- **El bloque de tipo "HTML" del editor no está disponible** — existe en el modelo de datos pero no tiene editor visual ni se renderiza al publicar. No aparece en la biblioteca de bloques.
- **Un refresh token robado es válido 30 días** sin forma de revocarlo remotamente (no hay "cerrar sesión en todos los dispositivos"). Asumible para un piloto con pocos usuarios de confianza; no recomendable a partir de ~10-30 clientes sin resolverlo antes (ver `docs/12-Plan-Lanzamiento.md`, Fase 2).
- **Sin cobro automatizado.** Los planes de pago se activan manualmente (Payment Link + marcar el plan a mano en base de datos) hasta que exista integración real de Stripe con webhooks.
- **Sin dashboard de monitorización** más allá de `/v1/health`. Un incidente se detecta por queja del cliente o por Sentry (si está conectado), no por alerta proactiva.
- **RLS (aislamiento de datos a nivel de base de datos) no cubre las tablas `members` ni `roles`** — decisión explícita y documentada, no un descuido (ver `docs/11-Auditoria-Produccion.md`). La protección ahí es solo a nivel de aplicación (`WorkspaceAccessGuard`, verificado y funcionando).
- **Analítica de páginas públicas escribe de forma síncrona**, sin cola — no afecta a tráfico bajo/medio, podría convertirse en cuello de botella con mucho tráfico.

## Cómo reportar un bug

_(definir el proceso — ej. "abre un issue en GitHub" o "escribe a soporte@...")_. Al reportar, es útil incluir: qué se esperaba que pasara, qué pasó en realidad, y si es posible, el ID de la petición que aparece en la respuesta de error (cuando lo haya).

## Documentos relacionados

- `docs/11-Auditoria-Produccion.md` — auditoría técnica completa, con todo lo verificado (no solo revisado por lectura).
- `docs/12-Plan-Lanzamiento.md` — plan de lanzamiento por fases, con las tareas priorizadas y su esfuerzo estimado.
