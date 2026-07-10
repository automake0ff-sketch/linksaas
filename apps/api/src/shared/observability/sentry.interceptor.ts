import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { Observable, catchError, throwError } from 'rxjs';

/**
 * No sustituye el manejo de excepciones de Nest — solo reporta a Sentry y
 * relanza el mismo error para que el filtro por defecto (o cualquier otro)
 * siga generando la respuesta HTTP normal. Si SENTRY_DSN no está
 * configurado, Sentry.captureException() es un no-op seguro (el SDK no
 * lanza si no se inicializó).
 *
 * Solo se reportan errores 5xx o no-HTTP (bugs reales) — un 400 de
 * validación o un 404 no son "errores de la aplicación", son usuarios
 * usando la API de forma esperada, y llenarían Sentry de ruido.
 */
@Injectable()
export class SentryInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      catchError((error: unknown) => {
        const isClientError = error instanceof HttpException && error.getStatus() < 500;
        if (!isClientError) {
          Sentry.captureException(error);
        }
        return throwError(() => error);
      }),
    );
  }
}
