import { Body, Controller, Get, HttpCode, NotFoundException, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { PrismaService } from '../../../shared/infrastructure/prisma.service';
import { Public } from '../../../shared/decorators/public.decorator';

const TrackEventSchema = z.object({
  workspaceSlug: z.string(),
  blockId: z.string().optional(),
  eventType: z.enum(['view', 'click']),
});
class TrackEventDto extends createZodDto(TrackEventSchema) {}

const DEFAULT_THEME = {
  surface: '#FFFFFF',
  surfaceSecondary: '#F4F5F8',
  textPrimary: '#12151C',
  textSecondary: '#5B6270',
  border: '#E3E5EA',
  accent: '#3454D1',
  fontDisplay: 'Space Grotesk',
  fontBody: 'Inter',
  radius: 'md' as const,
};

/**
 * Endpoints deliberadamente fuera de cualquier guard de auth (@Public) y sin
 * tocar tablas de escritura salvo analytics_events (fire-and-forget). Es el
 * único punto donde el tráfico público toca la API transaccional — ver
 * docs/02-Arquitectura.md §8 para el razonamiento de por qué esto es
 * aceptable en Fase A y qué cambia cuando se separe en un servicio propio.
 */
@ApiTags('public')
@Controller('public')
@Public()
export class PublicPagesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('pages/:slug')
  async getPage(@Param('slug') slug: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { slug },
      include: {
        pages: {
          where: { slug: '' }, // página raíz del workspace
          include: { theme: true },
          take: 1,
        },
      },
    });

    if (!workspace || workspace.pages.length === 0) {
      throw new NotFoundException('Página no encontrada');
    }

    const page = workspace.pages[0];
    if (!page.publishedVersionId) {
      throw new NotFoundException('Esta página aún no ha sido publicada');
    }

    const version = await this.prisma.pageVersion.findUnique({
      where: { id: page.publishedVersionId },
    });

    return {
      workspaceSlug: workspace.slug,
      title: page.title,
      blocks: version?.blocks ?? [],
      theme: page.theme?.tokens ?? DEFAULT_THEME,
      avatarUrl: null,
      bio: null,
    };
  }

  @Post('events')
  @HttpCode(202)
  @Throttle({ default: { limit: 60, ttl: 60_000 } }) // por IP — evita flood de eventos falsos
  async trackEvent(@Body() dto: TrackEventDto) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { slug: dto.workspaceSlug },
      select: { id: true },
    });
    if (!workspace) return; // no revelamos si el slug existe con un error distinto

    await this.prisma.analyticsEvent.create({
      data: {
        workspaceId: workspace.id,
        blockId: dto.blockId ?? null,
        eventType: dto.eventType,
      },
    });
    // En producción esto encola en BullMQ en vez de escribir síncronamente
    // (ver docs/03-Base-de-Datos.md, tabla particionada de alto volumen) —
    // el encolado se añade cuando se implemente el worker en Fase A.
  }
}
