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
