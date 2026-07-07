import { describe, expect, it } from 'vitest';
import { Page } from '../page.entity';
import { DomainError } from '../../../../shared/kernel/entity';

function buildPageWithBlocks(count: number): Page {
  const page = Page.createEmpty('page-1', { workspaceId: 'ws-1', slug: '' });
  for (let i = 0; i < count; i++) {
    page.addBlock(`block-${i}`, 'link', { label: `Link ${i}`, url: 'https://x.com' });
  }
  return page;
}

describe('Page (dominio) — editor de bloques', () => {
  it('añade bloques con order incremental', () => {
    const page = buildPageWithBlocks(3);
    expect(page.draftBlocks.map((b) => b.order)).toEqual([0, 1, 2]);
  });

  it('reordena bloques respetando el nuevo orden dado', () => {
    const page = buildPageWithBlocks(3);
    page.reorderBlocks(['block-2', 'block-0', 'block-1']);
    expect(page.draftBlocks.map((b) => b.id)).toEqual(['block-2', 'block-0', 'block-1']);
    expect(page.draftBlocks.map((b) => b.order)).toEqual([0, 1, 2]);
  });

  it('rechaza un reorder que no contiene exactamente los mismos bloques', () => {
    const page = buildPageWithBlocks(2);
    expect(() => page.reorderBlocks(['block-0', 'block-999'])).toThrow(DomainError);
  });

  it('duplica un bloque justo después del original y reindexa', () => {
    const page = buildPageWithBlocks(2);
    page.duplicateBlock('block-0', 'block-0-copy');
    expect(page.draftBlocks.map((b) => b.id)).toEqual(['block-0', 'block-0-copy', 'block-1']);
    expect(page.draftBlocks.map((b) => b.order)).toEqual([0, 1, 2]);
  });

  it('elimina un bloque y reindexa el orden de los restantes', () => {
    const page = buildPageWithBlocks(3);
    page.removeBlock('block-1');
    expect(page.draftBlocks.map((b) => b.id)).toEqual(['block-0', 'block-2']);
    expect(page.draftBlocks.map((b) => b.order)).toEqual([0, 1]);
  });

  it('rechaza operaciones sobre un bloque inexistente', () => {
    const page = buildPageWithBlocks(1);
    expect(() => page.updateBlockConfig('no-existe', {})).toThrow(DomainError);
    expect(() => page.removeBlock('no-existe')).toThrow(DomainError);
  });

  it('rechaza publicar una página sin bloques', () => {
    const page = Page.createEmpty('page-1', { workspaceId: 'ws-1', slug: '' });
    expect(() => page.preparePublishSnapshot()).toThrow(DomainError);
  });

  it('marca la página como publicada tras publicar', () => {
    const page = buildPageWithBlocks(1);
    page.preparePublishSnapshot();
    page.markPublished('version-1');
    expect(page.isPublished).toBe(true);
    expect(page.publishedVersionId).toBe('version-1');
  });
});
