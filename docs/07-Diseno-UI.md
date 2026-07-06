# Diseño UI — LinkForge

## Dirección de diseño

Referencia de calidad (no de estilo copiado): Linear, Notion, Framer, Stripe. Lo que tomamos de ellos es **disciplina** — tipografía consistente, espaciado generoso, jerarquía clara, motion con propósito — no sus componentes literales.

**Identidad propia de LinkForge:** donde Liinks/Linktree se sienten "playful/consumer", LinkForge se posiciona más cerca de una herramienta profesional (como Stripe o Vercel) que da confianza para vender y automatizar, sin perder calidez para creadores individuales. Paleta neutra con un color de acento configurable por el propio producto (coherente con que cada usuario personaliza su página pública).

## Sistema de diseño (paquete `packages/ui`)

- **Tipografía:** una familia sans para UI, tamaños en escala modular (12/14/16/20/24/32/40). Nunca más de 2 pesos (regular/medium) en el panel — el peso bold se reserva para la página pública del usuario, donde su marca manda.
- **Espaciado:** escala de 4px (4/8/12/16/24/32/48/64).
- **Color:** tokens semánticos (`--surface`, `--text-primary`, `--text-secondary`, `--border`, `--accent`, `--danger`, `--success`, `--warning`), no hex directos en componentes. Modo claro/oscuro desde el día 1 (no como añadido posterior).
- **Componentes base:** Shadcn UI como fundación (accesible, headless), con theming propio encima. Se documentan en Storybook.
- **Motion:** Framer Motion solo para transiciones con propósito (aparición de bloques, drag&drop, cambios de estado) — nunca decorativo. Duraciones cortas (150-250ms), easing consistente.

## Pantallas clave del panel (Fase A)

1. **Onboarding:** crear workspace → elegir slug → primer bloque sugerido (con IA opcionalmente, Fase D). Objetivo: usuario publica algo en < 5 minutos.
2. **Editor:** panel central con preview en vivo (móvil/tablet/desktop), barra lateral de bloques disponibles, panel de propiedades del bloque seleccionado. Autosave visible (indicador sutil, no intrusivo).
3. **Dashboard de analítica:** resumen arriba (visitas, clicks, CTR), gráficos de tendencia, tabla de bloques con mejor rendimiento, filtros por fecha/país/dispositivo.
4. **Ajustes de workspace:** miembros y roles, dominios, temas, facturación.
5. **Marketplace de plugins (Fase C+):** catálogo con categorías, estado de instalación, permisos requeridos visibles antes de instalar.

## Página pública

- Renderizado por bloques, cada tipo de bloque con su propio componente en `block-renderer`, compartido entre editor y público (evita divergencia visual).
- Prioridad de rendimiento sobre efectos: animaciones de la página pública son opt-in por el usuario (vía tema), nunca forzadas por el sistema, para no penalizar LCP en cuentas gratuitas con muchos bloques.

## Accesibilidad

- Contraste AA mínimo en todos los temas predefinidos (validado automáticamente al guardar un tema custom, con aviso si no cumple).
- Navegación completa por teclado en el editor (drag&drop con alternativa de teclado: mover con atajos).
- Componentes Shadcn ya cumplen ARIA base; se audita con axe-core en CI.
