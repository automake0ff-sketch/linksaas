import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { DomainEventBus } from '../kernel/domain-event-bus';

@Global()
@Module({
  providers: [PrismaService, DomainEventBus],
  exports: [PrismaService, DomainEventBus],
})
export class SharedInfraModule {}
