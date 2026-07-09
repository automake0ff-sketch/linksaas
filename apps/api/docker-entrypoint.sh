#!/bin/sh
set -e

echo "→ Aplicando migraciones de base de datos..."
npx prisma migrate deploy --schema=prisma/schema.prisma

echo "→ Sembrando roles y temas de sistema (idempotente, seguro en cada arranque)..."
npx ts-node --transpile-only prisma/seed.ts

echo "→ Arrancando la API..."
exec node dist/main.js
