# Plan de seguridad — LinkForge

## Principios

Seguridad por capas (defense in depth): ninguna medida individual es suficiente por sí sola — RLS en base de datos protege incluso si hay un bug en el código de aplicación; validación en el borde protege incluso si un módulo interno confía demasiado en su input.

## OWASP Top 10 — mapeo a controles concretos

| Riesgo | Control en LinkForge |
|---|---|
| Broken Access Control | RBAC + ABAC en cada endpoint (guard de Nest.js), RLS en PostgreSQL como segunda capa, `workspace_id` nunca aceptado desde el cliente (se deriva del token) |
| Cryptographic Failures | TLS obligatorio en todo el tráfico, cifrado en reposo de configuración de plugins (KMS por tenant), contraseñas con Argon2id |
| Injection | Prisma (queries parametrizadas por defecto), validación estricta con Zod en cada input, sanitización de HTML de usuario (bloque tipo "HTML custom") con allowlist |
| Insecure Design | Modelado de amenazas por módulo antes de implementar comercio y plugins (son las superficies de mayor riesgo) |
| Security Misconfiguration | Helmet con CSP estricta, headers de seguridad por defecto, escaneo de configuración en CI (ej. secretos expuestos) |
| Vulnerable Components | Dependabot/Renovate activo, auditoría de dependencias en CI, bloqueo de build si hay CVE crítico sin parchear |
| Auth Failures | 2FA y passkeys soportados, rate limiting de intentos de login, rotación de refresh tokens, detección de reuse de tokens (posible robo) |
| Software/Data Integrity | Firma de artefactos de CI/CD, revisión obligatoria de PRs, `Idempotency-Key` en operaciones de pago |
| Logging/Monitoring Failures | Logs estructurados centralizados, alertas en Sentry para errores 5xx y picos anómalos, auditoría de acciones sensibles (cambios de rol, exportación de datos, instalación de plugins) |
| SSRF | Validación estricta de URLs en webhooks salientes/entrantes de plugins, lista de dominios permitidos donde aplique |

## Multi-tenant: aislamiento como control de seguridad, no solo de datos

- RLS obligatoria en toda tabla con `workspace_id` (ver documento de Base de Datos).
- Tests de aislamiento automatizados: cada PR que toque un módulo con datos de tenant corre un test que verifica que el workspace A no puede leer/escribir datos del workspace B, ni siquiera con IDs adivinados.

## Plugins como superficie de ataque

- Cada plugin declara permisos explícitos (qué datos puede leer/qué acciones puede disparar); el usuario los aprueba al instalar.
- La configuración de un plugin (tokens de API de terceros) se cifra en reposo con clave derivada por tenant (KMS), nunca en texto plano ni en logs.
- Webhooks entrantes de plugins se validan por firma (HMAC) cuando el proveedor lo soporta, y se limita el rate por workspace.

## Pagos

- Nunca se almacenan datos de tarjeta en los servidores de LinkForge — se delega íntegramente en Stripe/PayPal/Paddle (PCI DSS es responsabilidad del proveedor, no nuestra).
- Webhooks de pago verificados por firma del proveedor antes de procesar.

## Gestión de secretos

- Secretos en gestor dedicado (ej. Doppler/Vault/GCP Secret Manager según hosting final), nunca en `.env` versionado.
- Rotación programada de claves (JWT signing key, KMS) con periodo de solape para no invalidar sesiones activas.

## Auditoría y cumplimiento

- Tabla `audit_logs` (acción, actor, workspace, timestamp, IP) para acciones sensibles: cambios de rol, exportación/eliminación de datos, instalación de plugins, cambios de facturación.
- Exportación y eliminación de datos de usuario (GDPR) implementadas como casos de uso de primera clase, no como script manual ad-hoc.

## Detección de fraude (comercio, Fase B+)

- Reglas básicas iniciales (velocity checks: múltiples pedidos fallidos desde el mismo origen en poco tiempo) delegando la puntuación de riesgo avanzada al proveedor de pagos (Stripe Radar), en vez de reconstruir un motor de fraude propio desde cero.
