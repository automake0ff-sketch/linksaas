import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ExecutionContext, CanActivate } from '@nestjs/common';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { JwtPayload } from './jwt-auth.guard';

/**
 * Guard aplicado globalmente (APP_GUARD en app.module.ts). Por defecto TODA
 * ruta requiere JWT válido — el modelo es "secure by default": una ruta
 * nueva que un desarrollador olvide marcar es privada, no pública por omisión.
 * Las rutas que sí deben ser públicas (registro, login, refresh, página
 * pública) se marcan explícitamente con @Public().
 */
@Injectable()
export class PublicAuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly jwt: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest<Request>();
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token no proporcionado');
    }

    try {
      req.user = this.jwt.verify<JwtPayload>(header.slice('Bearer '.length));
      return true;
    } catch {
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }
}
