import { AggregateRoot, DomainError } from '../../../shared/kernel/entity';

export const BLOCK_TYPES = [
  'link', 'text', 'image', 'social', 'video', 'embed',
  'gallery', 'faq', 'countdown', 'form', 'product', 'html', 'markdown',
] as const;
export type BlockType = (typeof BLOCK_TYPES)[number];

export interface PageBlock {
  id: string;
  type: BlockType;
  order: number;
  config: Record<string, unknown>;
}

interface PageProps {
  workspaceId: string;
  slug: string;
  title: string | null;
  draftBlocks: PageBlock[];
  publishedVersionId: string | null;
  themeId: string | null;
}

// Límite de negocio: evita páginas inmanejables (rendimiento del editor y
// de la página pública) — no es una limitación técnica arbitraria, es una
// decisión de producto documentada aquí donde vive la regla.
const MAX_BLOCKS_PER_PAGE = 100;

export class Page extends AggregateRoot<PageProps> {
  private constructor(id: string, props: PageProps) {
    super(id, props);
  }

  static reconstitute(id: string, props: PageProps): Page {
    return new Page(id, props);
  }

  static createEmpty(id: string, params: { workspaceId: string; slug: string }): Page {
    const page = new Page(id, {
      workspaceId: params.workspaceId,
      slug: params.slug,
      title: null,
      draftBlocks: [],
      publishedVersionId: null,
      themeId: null,
    });
    page.addDomainEvent({
      name: 'page.created',
      occurredAt: new Date(),
      payload: { pageId: id, workspaceId: params.workspaceId },
    });
    return page;
  }

  get draftBlocks(): readonly PageBlock[] {
    return this.props.draftBlocks;
  }

  get workspaceId(): string {
    return this.props.workspaceId;
  }

  get publishedVersionId(): string | null {
    return this.props.publishedVersionId;
  }

  get isPublished(): boolean {
    return !!this.props.publishedVersionId;
  }

  addBlock(newBlockId: string, type: BlockType, config: Record<string, unknown>): void {
    if (this.props.draftBlocks.length >= MAX_BLOCKS_PER_PAGE) {
      throw new DomainError(
        `Una página no puede tener más de ${MAX_BLOCKS_PER_PAGE} bloques`,
        'MAX_BLOCKS_EXCEEDED',
      );
    }
    this.props.draftBlocks.push({
      id: newBlockId,
      type,
      order: this.props.draftBlocks.length,
      config,
    });
  }

  updateBlockConfig(blockId: string, config: Record<string, unknown>): void {
    const block = this.findBlockOrThrow(blockId);
    block.config = config;
  }

  removeBlock(blockId: string): void {
    this.findBlockOrThrow(blockId);
    this.props.draftBlocks = this.props.draftBlocks.filter((b) => b.id !== blockId);
    this.reindexOrder();
  }

  duplicateBlock(blockId: string, newBlockId: string): void {
    if (this.props.draftBlocks.length >= MAX_BLOCKS_PER_PAGE) {
      throw new DomainError(
        `Una página no puede tener más de ${MAX_BLOCKS_PER_PAGE} bloques`,
        'MAX_BLOCKS_EXCEEDED',
      );
    }
    const original = this.findBlockOrThrow(blockId);
    const index = this.props.draftBlocks.findIndex((b) => b.id === blockId);
    const copy: PageBlock = {
      id: newBlockId,
      type: original.type,
      order: index + 1,
      config: { ...original.config },
    };
    this.props.draftBlocks.splice(index + 1, 0, copy);
    this.reindexOrder();
  }

  reorderBlocks(orderedBlockIds: string[]): void {
    const currentIds = new Set(this.props.draftBlocks.map((b) => b.id));
    const sameSet =
      orderedBlockIds.length === currentIds.size &&
      orderedBlockIds.every((id) => currentIds.has(id));
    if (!sameSet) {
      throw new DomainError(
        'El nuevo orden debe contener exactamente los mismos bloques existentes',
        'INVALID_REORDER',
      );
    }
    const byId = new Map(this.props.draftBlocks.map((b) => [b.id, b]));
    this.props.draftBlocks = orderedBlockIds.map((id, index) => ({
      ...byId.get(id)!,
      order: index,
    }));
  }

  /** Devuelve el snapshot inmutable que se guardará como PageVersion al publicar. */
  preparePublishSnapshot(): PageBlock[] {
    if (this.props.draftBlocks.length === 0) {
      throw new DomainError('No se puede publicar una página sin bloques', 'EMPTY_PAGE');
    }
    return this.props.draftBlocks.map((b) => ({ ...b }));
  }

  markPublished(versionId: string): void {
    this.props.publishedVersionId = versionId;
    this.addDomainEvent({
      name: 'page.published',
      occurredAt: new Date(),
      payload: { pageId: this.id, workspaceId: this.props.workspaceId, versionId },
    });
  }

  restoreFromSnapshot(blocks: PageBlock[]): void {
    this.props.draftBlocks = blocks.map((b) => ({ ...b }));
  }

  /**
   * Usado por el autosave del editor: el cliente mantiene el estado local
   * (tras drag&drop, edición, deshacer/rehacer) y sincroniza el array
   * completo de bloques de una vez, en vez de una llamada por micro-acción.
   * Sigue validando las mismas reglas de negocio (límite de bloques, IDs
   * únicos) que las mutaciones granulares.
   */
  replaceAllBlocks(blocks: PageBlock[]): void {
    if (blocks.length > MAX_BLOCKS_PER_PAGE) {
      throw new DomainError(
        `Una página no puede tener más de ${MAX_BLOCKS_PER_PAGE} bloques`,
        'MAX_BLOCKS_EXCEEDED',
      );
    }
    const ids = new Set(blocks.map((b) => b.id));
    if (ids.size !== blocks.length) {
      throw new DomainError('Los bloques deben tener IDs únicos', 'DUPLICATE_BLOCK_ID');
    }
    this.props.draftBlocks = blocks.map((b, index) => ({ ...b, order: index }));
  }

  private findBlockOrThrow(blockId: string): PageBlock {
    const block = this.props.draftBlocks.find((b) => b.id === blockId);
    if (!block) throw new DomainError(`Bloque ${blockId} no encontrado`, 'BLOCK_NOT_FOUND');
    return block;
  }

  private reindexOrder(): void {
    this.props.draftBlocks.forEach((b, index) => (b.order = index));
  }
}
