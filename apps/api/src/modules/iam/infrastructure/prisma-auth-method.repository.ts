import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/prisma.service';
import { AuthMethodRepositoryPort } from '../domain/ports';

@Injectable()
export class PrismaAuthMethodRepository implements AuthMethodRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findPasswordMethod(userId: string) {
    const row = await this.prisma.authMethod.findFirst({
      where: { userId, provider: 'password' },
    });
    return row?.passwordHash ? { passwordHash: row.passwordHash } : null;
  }

  async createPasswordMethod(userId: string, passwordHash: string): Promise<void> {
    await this.prisma.authMethod.create({
      data: { userId, provider: 'password', passwordHash },
    });
  }

  async findOAuthMethod(provider: string, providerAccountId: string) {
    const row = await this.prisma.authMethod.findFirst({
      where: { provider: provider as never, providerAccountId },
      select: { userId: true },
    });
    return row ?? null;
  }

  async createOAuthMethod(
    userId: string,
    provider: string,
    providerAccountId: string,
  ): Promise<void> {
    await this.prisma.authMethod.create({
      data: { userId, provider: provider as never, providerAccountId },
    });
  }
}
