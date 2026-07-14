import { describe, expect, it, vi } from 'vitest';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { WorkspaceAccessGuard } from '../workspace-access.guard';

function buildContext(overrides: {
  params?: Record<string, string>;
  workspaceId?: string;
  userId?: string;
}): ExecutionContext {
  const req = {
    params: overrides.params ?? {},
    workspaceId: overrides.workspaceId,
    user: overrides.userId ? { sub: overrides.userId } : undefined,
  };
  return {
    switchToHttp: () => ({ getRequest: () => req }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;
}

describe('WorkspaceAccessGuard', () => {
  it('lee el workspaceId de la URL (@Param), no de un header que el frontend nunca envía', async () => {
    const prisma = {
      member: {
        findUnique: vi.fn().mockResolvedValue({
          status: 'active',
          role: { permissions: ['pages.edit'] },
        }),
      },
    };
    const guard = new WorkspaceAccessGuard(prisma as never, new Reflector());

    const ctx = buildContext({ params: { workspaceId: 'ws-1' }, userId: 'user-1' });
    const result = await guard.canActivate(ctx);

    expect(result).toBe(true);
    expect(prisma.member.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { workspaceId_userId: { workspaceId: 'ws-1', userId: 'user-1' } },
      }),
    );
  });

  it('rechaza si no hay workspaceId en la URL ni en el request (regresión del bug real)', async () => {
    const prisma = { member: { findUnique: vi.fn() } };
    const guard = new WorkspaceAccessGuard(prisma as never, new Reflector());

    const ctx = buildContext({ params: {}, userId: 'user-1' });

    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
    expect(prisma.member.findUnique).not.toHaveBeenCalled();
  });

  it('rechaza si el usuario no es miembro del workspace', async () => {
    const prisma = { member: { findUnique: vi.fn().mockResolvedValue(null) } };
    const guard = new WorkspaceAccessGuard(prisma as never, new Reflector());

    const ctx = buildContext({ params: { workspaceId: 'ws-1' }, userId: 'user-1' });

    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('rechaza si el miembro no tiene el permiso requerido', async () => {
    const prisma = {
      member: {
        findUnique: vi.fn().mockResolvedValue({
          status: 'active',
          role: { permissions: ['members.view'] }, // sin 'pages.publish'
        }),
      },
    };
    const reflector = new Reflector();
    vi.spyOn(reflector, 'get').mockReturnValue('pages.publish');
    const guard = new WorkspaceAccessGuard(prisma as never, reflector);

    const ctx = buildContext({ params: { workspaceId: 'ws-1' }, userId: 'user-1' });

    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('el permiso comodín "*" (rol owner) pasa cualquier chequeo de permiso', async () => {
    const prisma = {
      member: {
        findUnique: vi.fn().mockResolvedValue({ status: 'active', role: { permissions: ['*'] } }),
      },
    };
    const reflector = new Reflector();
    vi.spyOn(reflector, 'get').mockReturnValue('pages.publish');
    const guard = new WorkspaceAccessGuard(prisma as never, reflector);

    const ctx = buildContext({ params: { workspaceId: 'ws-1' }, userId: 'user-1' });

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });
});
