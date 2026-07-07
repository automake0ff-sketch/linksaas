import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  PAGE_REPOSITORY,
  PAGE_VERSION_REPOSITORY,
  PageRepositoryPort,
  PageVersionRepositoryPort,
} from '../domain/ports';
import { DomainEventBus } from '../../../shared/kernel/domain-event-bus';

@Injectable()
export class PublishPageUseCase {
  constructor(
    @Inject(PAGE_REPOSITORY) private readonly pages: PageRepositoryPort,
    @Inject(PAGE_VERSION_REPOSITORY) private readonly versions: PageVersionRepositoryPort,
    private readonly eventBus: DomainEventBus,
  ) {}

  async execute(input: {
    workspaceId: string;
    publishedBy: string;
  }): Promise<{ versionId: string }> {
    const page = await this.pages.findRootPageByWorkspace(input.workspaceId);
    if (!page) throw new NotFoundException('Página no encontrada para este workspace');

    // La validación de negocio (no publicar vacío, etc.) vive en el
    // agregado — el caso de uso solo orquesta: dominio decide, aquí se
    // persiste y se invalida caché.
    const snapshot = page.preparePublishSnapshot();
    const version = await this.versions.createSnapshot(page.id, snapshot, input.publishedBy);

    page.markPublished(version.id);
    await this.pages.save(page);

    this.eventBus.publishAll(page.pullDomainEvents());
    // page.published dispara (vía listener, módulo separado):
    // invalidación de la caché de edge de web-public para este slug.

    return { versionId: version.id };
  }
}

@Injectable()
export class ListPageVersionsUseCase {
  constructor(
    @Inject(PAGE_REPOSITORY) private readonly pages: PageRepositoryPort,
    @Inject(PAGE_VERSION_REPOSITORY) private readonly versions: PageVersionRepositoryPort,
  ) {}

  async execute(workspaceId: string) {
    const page = await this.pages.findRootPageByWorkspace(workspaceId);
    if (!page) throw new NotFoundException('Página no encontrada para este workspace');
    return this.versions.listByPage(page.id);
  }
}

@Injectable()
export class RestorePageVersionUseCase {
  constructor(
    @Inject(PAGE_REPOSITORY) private readonly pages: PageRepositoryPort,
    @Inject(PAGE_VERSION_REPOSITORY) private readonly versions: PageVersionRepositoryPort,
  ) {}

  async execute(input: { workspaceId: string; versionId: string }): Promise<void> {
    const page = await this.pages.findRootPageByWorkspace(input.workspaceId);
    if (!page) throw new NotFoundException('Página no encontrada para este workspace');

    const version = await this.versions.findById(input.versionId);
    if (!version) throw new NotFoundException('Versión no encontrada');

    // Restaurar solo toca el BORRADOR — el usuario debe volver a pulsar
    // "publicar" para que el restore sea visible públicamente. Restaurar
    // nunca publica implícitamente: sería sorprendente y potencialmente
    // destructivo (publicar contenido antiguo sin revisión).
    page.restoreFromSnapshot(version.blocks as never);
    await this.pages.save(page);
  }
}
