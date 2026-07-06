import { Injectable, NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';

/**
 * Para rutas del PANEL AUTENTICADO, el workspace activo llega en el JWT
 * (claim `workspace_id`) o en el header `X-Workspace-Id`, nunca se confía
 * en un valor libre del cliente sin verificar membresía — eso lo hace el
 * guard de autorización, no este middleware.
 *
 * Para la PÁGINA PÚBLICA (web-public), el tenant se resuelve por hostname
 * (subdominio o dominio custom verificado) — ver resolvePublicTenant().
 */
declare module 'express' {
  interface Request {
    workspaceId?: string;
  }
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    const headerWorkspace = req.header('x-workspace-id');
    if (headerWorkspace) {
      req.workspaceId = headerWorkspace;
    }
    // La resolución final y verificada (¿el usuario del JWT es miembro de
    // este workspace?) ocurre en WorkspaceAccessGuard, aplicado por ruta.
    next();
  }
}

export function resolvePublicTenantFromHost(host: string, platformDomain: string): {
  type: 'subdomain' | 'custom_domain' | 'path';
  value: string;
} | null {
  if (host.endsWith(`.${platformDomain}`)) {
    const sub = host.replace(`.${platformDomain}`, '');
    if (sub && sub !== 'www') return { type: 'subdomain', value: sub };
    return null;
  }
  if (host !== platformDomain) {
    return { type: 'custom_domain', value: host };
  }
  return null; // dominio raíz sin subdominio → se resuelve por path (/usuario)
}
