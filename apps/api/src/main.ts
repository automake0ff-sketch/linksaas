import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as Sentry from '@sentry/node';
import { AppModule } from './app.module';
import { SentryInterceptor } from './shared/observability/sentry.interceptor';

// Se inicializa ANTES de crear la app para capturar también errores muy
// tempranos de arranque. Sin SENTRY_DSN (ver env.schema.ts, es opcional)
// esto queda como no-op — no rompe nada en local/dev sin cuenta de Sentry.
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV ?? 'development',
    tracesSampleRate: 0.1,
  });
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          objectSrc: ["'none'"],
          frameAncestors: ["'none'"],
        },
      },
    }),
  );
  app.use(cookieParser());

  app.enableCors({
    origin: (process.env.CORS_ORIGINS ?? '').split(',').filter(Boolean),
    credentials: true,
  });

  app.setGlobalPrefix('v1');
  app.useGlobalInterceptors(new SentryInterceptor());

  const config = new DocumentBuilder()
    .setTitle('LinkForge API')
    .setDescription('API pública y del panel de LinkForge')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('v1/docs', app, document);

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`API lista en http://localhost:${port}/v1 (docs en /v1/docs)`);
}
bootstrap();
