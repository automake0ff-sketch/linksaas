import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { PrismaService } from '../infrastructure/prisma.service';

export const RequirePermission = (permission: string) =>
  SetMetadata('required_permission', permission);

/**
 * RBAC (rol → permisos) + ABAC (permiso específico requerido por el endpoint).
 * Se ejecuta DESPUÉS del guard de autenticación (que puebla req.user).
 * Verifica membresía real en BD — nunca confía en el parámetro de la URL
 * sin cruzarlo contra la tabla members.
 */
@Injectable()
export class WorkspaceAccessGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context
      .switchToHttp()
      .getRequest<Request & { user?: { sub: string }; params: Record<string, string> }>();

    // El workspace viene de la URL (/workspaces/:workspaceId/...), que es
    // donde todos los controllers ya lo leen con @Param('workspaceId').
    // ANTES este guard miraba solo req.workspaceId (poblado por un header
    // X-Workspace-Id que el frontend nunca envía) — eso hacía que TODA
    // petición protegida devolviera 403 siempre, sin excepción. Se deja
    // req.workspaceId como fallback por si algún flujo futuro (resolución
    // por subdominio, ver TenantMiddleware) lo puebla desde otro sitio.
    const workspaceId = req.params.workspaceId ?? req.workspaceId;
    const userId = req.user?.sub;

    if (!workspaceId || !userId) {
      throw new ForbiddenException('Workspace no especificado o usuario no autenticado');
    }

    const member = await this.prisma.member.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
      include: { role: true },
    });

    if (!member || member.status !== 'active') {
      throw new ForbiddenException('No tienes acceso a este workspace');
    }

    const required = this.reflector.get<string>('required_permission', context.getHandler());
    if (required) {
      const permissions = member.role.permissions as string[];
      if (!permissions.includes(required) && !permissions.includes('*')) {
        throw new ForbiddenException(`Falta el permiso: ${required}`);
      }
    }

    return true;
  }
}
