import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';

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
   *
   * IMPORTANTE: `fn` recibe el cliente de la transacción (`tx`) y DEBE usarlo
   * para sus queries (`tx.page.findMany(...)`, no `this.page.findMany(...)`)
   * — de lo contrario esas queries corren en una conexión distinta a la que
   * tiene el `SET LOCAL` aplicado y RLS no las filtra.
   */
  async withWorkspace<T>(
    workspaceId: string,
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SET LOCAL app.current_workspace_id = '${workspaceId}'`);
      return fn(tx);
    });
  }
}
