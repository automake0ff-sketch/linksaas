import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../infrastructure/prisma.service';
import { Public } from '../decorators/public.decorator';

@ApiTags('health')
@Controller('health')
@Public()
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  /** Liveness: ¿el proceso está vivo? No toca dependencias externas — si
   * esto falla, Kubernetes/el balanceador debe reiniciar el contenedor. */
  @Get()
  liveness() {
    return { status: 'ok' };
  }

  /** Readiness: ¿puede este proceso servir tráfico ahora mismo? Comprueba
   * la conexión real a la base de datos — si Postgres no responde, este
   * endpoint debe fallar para que el balanceador deje de enrutar aquí en
   * vez de devolver 500s a usuarios reales. */
  @Get('ready')
  async readiness() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', database: 'up' };
    } catch {
      throw new ServiceUnavailableException({ status: 'error', database: 'down' });
    }
  }
}
