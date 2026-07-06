import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

export const CurrentUser = createParamDecorator((_: unknown, ctx: ExecutionContext): string => {
  const req = ctx.switchToHttp().getRequest<Request>();
  // JwtAuthGuard debe ejecutarse antes (ver app.module.ts, guard global) —
  // si req.user no existe aquí, es un error de configuración de guards,
  // no un caso a manejar con un if silencioso.
  return req.user!.sub;
});
