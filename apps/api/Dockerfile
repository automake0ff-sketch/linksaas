# ── deps ──────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
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
ENV NODE_ENV=production
COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/tsconfig.json ./tsconfig.json
COPY apps/api/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh
EXPOSE 3001
USER node
ENTRYPOINT ["./docker-entrypoint.sh"]
