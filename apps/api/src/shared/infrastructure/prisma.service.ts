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
   * queries de datos de tenant — nunca se llama a this.prisma.<modelo> directo
   * fuera de un contexto de workspace ya resuelto por el middleware de tenancy
   * o el WorkspaceAccessGuard.
   *
   * IMPORTANTE: `fn` recibe el cliente de la transacción (`tx`) y DEBE usarlo
   * para sus queries (`tx.page.findMany(...)`, no `this.page.findMany(...)`)
   * — de lo contrario esas queries corren en una conexión distinta a la que
   * tiene el `set_config` aplicado y RLS no las filtra.
   *
   * Se usa `set_config(..., true)` (equivale a SET LOCAL, alcance de
   * transacción) vía un template parametrizado de Prisma, no interpolando
   * el string en SQL crudo — SET LOCAL no admite bind parameters, pero
   * set_config() es una función normal que sí. Antes de este fix,
   * workspaceId se interpolaba directo en el SQL, lo cual era una
   * inyección SQL si ese valor llegaba sin validar.
   */
  async withWorkspace<T>(
    workspaceId: string,
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.current_workspace_id', ${workspaceId}, true)`;
      return fn(tx);
    });
  }
}
