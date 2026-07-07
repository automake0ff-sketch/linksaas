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

// Presets de sistema (workspaceId: null) — disponibles para todos los
// workspaces desde el primer día, sin que nadie tenga que crear un tema
// para poder publicar algo con buen aspecto.
const SYSTEM_THEMES: { name: string; tokens: Record<string, string> }[] = [
  {
    name: 'Claro',
    tokens: {
      surface: '#FFFFFF', surfaceSecondary: '#F4F5F8',
      textPrimary: '#12151C', textSecondary: '#5B6270',
      border: '#E3E5EA', accent: '#3454D1',
      fontDisplay: 'Space Grotesk', fontBody: 'Inter', radius: 'md',
    },
  },
  {
    name: 'Oscuro',
    tokens: {
      surface: '#0B0D12', surfaceSecondary: '#141821',
      textPrimary: '#F2F3F5', textSecondary: '#9AA1AE',
      border: '#242938', accent: '#5B7CFA',
      fontDisplay: 'Space Grotesk', fontBody: 'Inter', radius: 'md',
    },
  },
  {
    name: 'Editorial',
    tokens: {
      surface: '#FBF8F3', surfaceSecondary: '#F0EAE0',
      textPrimary: '#211D18', textSecondary: '#6B6055',
      border: '#E4DACB', accent: '#8B4A2B',
      fontDisplay: 'Playfair Display', fontBody: 'Fraunces', radius: 'sm',
    },
  },
  {
    name: 'Terminal',
    tokens: {
      surface: '#0A0E0A', surfaceSecondary: '#131A13',
      textPrimary: '#D6F5D6', textSecondary: '#7FA87F',
      border: '#1F2E1F', accent: '#3FD65C',
      fontDisplay: 'JetBrains Mono', fontBody: 'Roboto Mono', radius: 'none',
    },
  },
];

async function seedRoles() {
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
  console.log(`Seed de roles: ${SYSTEM_ROLES.length} roles de sistema`);
}

async function seedThemes() {
  for (const theme of SYSTEM_THEMES) {
    const existing = await prisma.theme.findFirst({
      where: { name: theme.name, workspaceId: null },
    });
    if (existing) {
      await prisma.theme.update({ where: { id: existing.id }, data: { tokens: theme.tokens } });
    } else {
      await prisma.theme.create({ data: { name: theme.name, tokens: theme.tokens, workspaceId: null } });
    }
  }
  console.log(`Seed de temas: ${SYSTEM_THEMES.length} temas de sistema`);
}

async function main() {
  await seedRoles();
  await seedThemes();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
