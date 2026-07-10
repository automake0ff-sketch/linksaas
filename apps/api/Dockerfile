# ── deps ──────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
# Alpine no trae OpenSSL por defecto — sin esto, Prisma no puede detectar
# la versión de libssl y asume una por defecto que no coincide con el
# motor real, lo que le hace intentar (re)descargar/escribir un binario
# distinto en tiempo de ejecución (visto en producción: "Can't write to
# /app/node_modules/@prisma/engines").
RUN apk add --no-cache openssl
COPY package.json package-lock.json* ./
COPY apps/api/package.json apps/api/package.json
COPY packages/contracts/package.json packages/contracts/package.json
COPY prisma ./prisma
RUN npm ci

# ── development (usado por docker-compose, con hot-reload) ──
FROM deps AS development
WORKDIR /app
COPY . .
RUN npx prisma generate --schema=prisma/schema.prisma
CMD ["npm", "run", "dev:api"]

# ── build ─────────────────────────────────────────────
FROM deps AS build
WORKDIR /app
COPY . .
RUN npx prisma generate --schema=prisma/schema.prisma
# contracts se compila ANTES que la API: apps/api importa sus tipos desde
# packages/contracts/dist/index.d.ts (ver packages/contracts/package.json,
# "types") — si no existe todavía, el build de la API fallaría o (peor)
# compilaría igual pero dejaría un require() en runtime que apunta a un
# .ts sin transpilar, que es exactamente el bug que esto corrige.
RUN npm run build --workspace=packages/contracts
RUN npm run build --workspace=apps/api

# ── runtime (imagen final de producción, mínima) ───────
FROM node:20-alpine AS runtime
WORKDIR /app
RUN apk add --no-cache openssl
ENV NODE_ENV=production
COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/tsconfig.json ./tsconfig.json
# El symlink node_modules/@linkforge/contracts apunta a ../../packages/contracts
# — sin copiar también el paquete real (con su dist/ ya compilado), ese
# symlink queda colgando en la imagen final y `require('@linkforge/contracts')`
# falla en el arranque (visto en producción: "Cannot find module").
COPY --from=build /app/packages/contracts/package.json ./packages/contracts/package.json
COPY --from=build /app/packages/contracts/dist ./packages/contracts/dist
COPY apps/api/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh
# Con el openssl correcto instalado arriba, prisma migrate deploy no
# debería necesitar escribir nada nuevo en runtime — pero se deja
# node_modules escribible por el usuario no-root como red de seguridad,
# en vez de asumir que la detección de plataforma siempre acierta.
RUN chown -R node:node /app
EXPOSE 3001
USER node
ENTRYPOINT ["./docker-entrypoint.sh"]
