import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import { IamModule } from './modules/iam/iam.module';
import { TenancyModule } from './modules/tenancy/tenancy.module';
import { PagesModule } from './modules/pages/pages.module';
import { ThemesModule } from './modules/themes/themes.module';
import { PublicPagesModule } from './modules/public-pages/public-pages.module';
import { SharedInfraModule } from './shared/infrastructure/shared-infra.module';
import { TenantMiddleware } from './shared/middleware/tenant.middleware';
import { PublicAuthGuard } from './shared/auth/public-route.guard';
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
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]), // límite global por defecto
    JwtModule.register({ secret: process.env.JWT_SECRET }),
    SharedInfraModule,
    IamModule,
    TenancyModule,
    PagesModule,
    ThemesModule,
    PublicPagesModule,
    // PagesModule, ThemesModule, AnalyticsModule... se añaden en los
    // siguientes incrementos (Fase A).
  ],
  providers: [{ provide: APP_GUARD, useClass: PublicAuthGuard }],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}
