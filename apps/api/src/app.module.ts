import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { IamModule } from './modules/iam/iam.module';
import { TenancyModule } from './modules/tenancy/tenancy.module';
import { PagesModule } from './modules/pages/pages.module';
import { ThemesModule } from './modules/themes/themes.module';
import { PublicPagesModule } from './modules/public-pages/public-pages.module';
import { SharedInfraModule } from './shared/infrastructure/shared-infra.module';
import { TenantMiddleware } from './shared/middleware/tenant.middleware';
import { PublicAuthGuard } from './shared/auth/public-route.guard';
import { HealthController } from './shared/health/health.controller';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { envSchema } from './config/env.schema';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // Falla rápido en boot si falta una variable requerida — mejor un
      // crash al arrancar que un 500 silencioso en producción a las 3am.
      validate: (config) => envSchema.parse(config),
    }),
    EventEmitterModule.forRoot(),
    ThrottlerModule.forRootAsync({
      useFactory: () => ({
        throttlers: [{ ttl: 60_000, limit: 100 }], // límite global por defecto
        // Sin esto, el rate limit vivía en memoria del proceso: con más de
        // una instancia de la API corriendo (cualquier despliegue con
        // autoscaling), cada réplica cuenta por separado y el límite real
        // efectivo se multiplica por el número de instancias — un
        // atacante podía repartir requests entre réplicas para saltárselo.
        // REDIS_URL sigue siendo opcional (ver env.schema.ts): en local
        // sin Redis, cae a memoria igual que antes.
        ...(process.env.REDIS_URL
          ? { storage: new ThrottlerStorageRedisService(process.env.REDIS_URL) }
          : {}),
      }),
    }),
    JwtModule.register({ secret: process.env.JWT_SECRET }),
    SharedInfraModule,
    NotificationsModule,
    IamModule,
    TenancyModule,
    PagesModule,
    ThemesModule,
    PublicPagesModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: PublicAuthGuard }],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}
