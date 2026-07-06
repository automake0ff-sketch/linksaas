import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /**
   * Ejecuta una operación con el workspace_id fijado en la sesión de Postgres
   * para que las políticas RLS lo apliquen. SIEMPRE se usa este wrapper para
   * queries de datos de tenant — nunca se llama a this.prisma.<model> directo
   * fuera de un contexto de workspace ya resuelto por el middleware de tenancy.
   */
  async withWorkspace<T>(workspaceId: string, fn: () => Promise<T>): Promise<T> {
    return this.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(
        `SET LOCAL app.current_workspace_id = '${workspaceId}'`,
      );
      // fn() debe usar `tx` en una implementación completa; aquí se expone
      // el patrón — cada repositorio de módulo con datos de tenant lo sigue.
      return fn();
    });
  }
}
