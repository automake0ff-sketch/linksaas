import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SYSTEM_ROLES: { name: string; permissions: string[] }[] = [
  { name: 'owner', permissions: ['*'] },
  {
    name: 'admin',
    permissions: [
      'members.invite', 'members.view', 'members.remove',
      'pages.edit', 'pages.publish', 'themes.edit',
      'billing.view', 'plugins.manage',
    ],
  },
  { name: 'editor', permissions: ['members.view', 'pages.edit', 'pages.publish', 'themes.edit'] },
  { name: 'viewer', permissions: ['members.view'] },
];

async function main() {
  for (const role of SYSTEM_ROLES) {
    const existing = await prisma.role.findFirst({
      where: { name: role.name, workspaceId: null },
    });
    if (existing) {
      await prisma.role.update({ where: { id: existing.id }, data: { permissions: role.permissions } });
    } else {
      await prisma.role.create({ data: { name: role.name, permissions: role.permissions, workspaceId: null } });
    }
  }
  // eslint-disable-next-line no-console
  console.log(`Seed completo: ${SYSTEM_ROLES.length} roles de sistema`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
