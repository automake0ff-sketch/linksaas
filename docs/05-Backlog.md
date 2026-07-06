# Backlog — Épicas e historias de usuario

Formato: `Como [rol], quiero [acción], para [beneficio]`. Criterios de aceptación resumidos. Priorización MoSCoW dentro de cada fase.

## Épica 1 — Identidad y acceso (Fase 0)

- **[Must]** Como visitante, quiero registrarme con Google/GitHub/email, para empezar sin fricción.
  - AC: OAuth funcional con 3 proveedores; email/password con verificación por correo.
- **[Must]** Como usuario, quiero activar 2FA o passkey, para proteger mi cuenta.
  - AC: TOTP funcional; registro y login con WebAuthn.
- **[Should]** Como usuario, quiero exportar todos mis datos, para cumplir mi derecho GDPR.
  - AC: exportación en JSON descargable en < 24h.
- **[Must]** Como usuario, quiero eliminar mi cuenta y todos mis datos, para ejercer el derecho al olvido.

## Épica 2 — Workspaces y equipos (Fase 0)

- **[Must]** Como usuario, quiero crear un workspace con un slug único, para tener mi propio espacio.
- **[Should]** Como owner, quiero invitar miembros con roles (admin/editor/viewer), para colaborar en equipo.
- **[Could]** Como agencia, quiero gestionar múltiples workspaces de clientes desde una cuenta, para operar eficientemente.

## Épica 3 — Editor de páginas (Fase A)

- **[Must]** Como usuario, quiero añadir bloques (link, texto, imagen, redes sociales) por drag&drop, para construir mi página sin código.
  - AC: reordenar, duplicar, eliminar bloques; autosave cada cambio.
- **[Must]** Como usuario, quiero deshacer/rehacer cambios, para no perder trabajo por error.
- **[Must]** Como usuario, quiero previsualizar en móvil/tablet/desktop antes de publicar, para asegurar que se ve bien en todos los dispositivos.
- **[Must]** Como usuario, quiero un botón "publicar" separado del borrador, para controlar cuándo mis cambios son visibles.
- **[Should]** Como usuario, quiero ver el historial de versiones de mi página, para poder revertir cambios.

## Épica 4 — Temas y personalización (Fase A)

- **[Must]** Como usuario, quiero elegir entre modo claro/oscuro y una paleta de colores, para que mi página refleje mi marca.
- **[Should]** Como usuario avanzado, quiero escribir CSS personalizado, para un control total del diseño.

## Épica 5 — Página pública y SEO (Fase A)

- **[Must]** Como visitante, quiero que la página cargue en menos de 1.5s, para no rebotar.
- **[Must]** Como usuario, quiero que mi página tenga OpenGraph y meta tags correctos, para que se comparta bien en redes.
- **[Should]** Como usuario, quiero un sitemap y datos estructurados (JSON-LD), para mejor indexación en buscadores.

## Épica 6 — Analítica (Fase A)

- **[Must]** Como usuario, quiero ver visitas y clicks por bloque, para saber qué funciona.
- **[Should]** Como usuario, quiero filtrar por país, dispositivo y referer, para entender a mi audiencia.
- **[Could]** Como usuario Pro, quiero conectar Google Analytics/PostHog, para centralizar mis métricas.

## Épica 7 — Comercio (Fase B)

- **[Must]** Como usuario, quiero vender un producto digital con checkout de Stripe, para monetizar mi audiencia.
- **[Should]** Como usuario, quiero ofrecer reservas de citas (tipo Calendly), para agendar clientes.
- **[Could]** Como usuario, quiero recibir donaciones, para financiarme por aportes voluntarios.

## Épica 8 — Automatización (Fase C)

- **[Must]** Como usuario, quiero crear un workflow "cuando pasa X, hacer Y", para automatizar tareas repetitivas.
  - AC: al menos 3 triggers y 3 acciones disponibles en el lanzamiento (nuevo pedido, nuevo formulario, nuevo suscriptor / enviar email, webhook, notificar Slack).
- **[Should]** Como usuario, quiero ver el historial de ejecuciones de un workflow con errores detallados, para depurar problemas.

## Épica 9 — Plugins (Fase C)

- **[Must]** Como usuario, quiero instalar/desinstalar integraciones desde un catálogo, para conectar mis herramientas sin código.
- **[Must]** Como usuario, quiero ver qué permisos/datos requiere un plugin antes de instalarlo, para tomar una decisión informada.

## Épica 10 — IA (Fase D)

- **[Must]** Como usuario, quiero que la IA genere mi biografía y CTA a partir de una breve descripción, para ahorrar tiempo.
- **[Should]** Como usuario, quiero un asistente dentro del panel que responda preguntas sobre mi cuenta y sugiera mejoras, para reducir la curva de aprendizaje.
- **[Could]** Como usuario Pro, quiero un agente SEO que audite mi página periódicamente, para mantenerla optimizada sin esfuerzo manual.

## Épica 11 — Panel de administración (transversal, empieza en Fase 0, crece en cada fase)

- **[Must]** Como admin de plataforma, quiero ver y gestionar usuarios/workspaces, para dar soporte y moderar.
- **[Should]** Como admin, quiero ver logs de auditoría de acciones sensibles, para investigar incidentes.
- **[Could]** Como admin, quiero un panel de moderación de reportes de abuso, para mantener la plataforma segura.
