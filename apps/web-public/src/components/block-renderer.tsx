import type { Block } from '@linkforge/contracts';
import Image from 'next/image';

/**
 * Este componente es candidato directo a extraerse a packages/block-renderer
 * en cuanto exista el editor en web-app (Fase A) — hoy vive aquí para no
 * crear un paquete compartido vacío antes de tiempo, pero la forma (un
 * componente puro por tipo de bloque, sin lógica de edición) ya está
 * diseñada para esa extracción sin reescritura.
 */
export function BlockRenderer({ block }: { block: Block }) {
  switch (block.type) {
    case 'link':
      return <LinkBlock config={block.config as { label: string; url: string }} />;
    case 'text':
      return <TextBlock config={block.config as { content: string }} />;
    case 'social':
      return <SocialBlock config={block.config as { platform: string; url: string }} />;
    case 'image':
      return <ImageBlock config={block.config as { src: string; alt?: string }} />;
    default:
      // Tipos aún no implementados (video, embed, gallery, faq, countdown,
      // form, product, html, markdown) se añaden en Fase A/B sin tocar este
      // switch más que para añadir un case — el resto del árbol no cambia.
      return null;
  }
}

function LinkBlock({ config }: { config: { label: string; url: string } }) {
  return (
    <a
      href={config.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block w-full rounded-xl border border-border bg-surface px-5 py-4 text-center font-medium text-text-primary shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md"
      data-block-type="link"
    >
      {config.label}
    </a>
  );
}

function TextBlock({ config }: { config: { content: string } }) {
  return <p className="text-center text-text-secondary">{config.content}</p>;
}

function SocialBlock({ config }: { config: { platform: string; url: string } }) {
  return (
    <a
      href={config.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-center gap-2 rounded-xl border border-border bg-surface px-5 py-3 text-sm font-medium text-text-primary hover:bg-surface-2"
    >
      {config.platform}
    </a>
  );
}

function ImageBlock({ config }: { config: { src: string; alt?: string } }) {
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border">
      <Image src={config.src} alt={config.alt ?? ''} fill className="object-cover" />
    </div>
  );
}
