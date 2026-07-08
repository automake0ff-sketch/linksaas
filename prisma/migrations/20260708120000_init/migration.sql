-- LinkForge — migración inicial
-- Escrita a mano porque el motor de Prisma no pudo descargarse en el
-- entorno donde se generó (ver docs/11-Auditoria-Produccion.md). Aplicada
-- y verificada manualmente con psql contra un Postgres real antes de
-- commitear. Antes de depender de ella en producción, se recomienda
-- ejecutar una vez `prisma migrate dev` en un entorno con red completa
-- para que Prisma confirme que coincide exactamente con schema.prisma
-- (comando: `npx prisma migrate diff --from-migrations prisma/migrations
-- --to-schema-datamodel prisma/schema.prisma --script`).

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Prisma no soporta UUIDv7 nativamente todavía, así que se define aquí.
-- UUIDv7 (a diferencia de v4) es ordenable por tiempo de creación, lo que
-- da mejor localidad de índice B-tree que UUIDs aleatorios — importante en
-- tablas de alto volumen como analytics_events (Fase B+).
CREATE OR REPLACE FUNCTION uuid_generate_v7()
RETURNS uuid
AS $$
DECLARE
  unix_ts_ms bytea;
  uuid_bytes bytea;
BEGIN
  unix_ts_ms = substring(int8send(floor(extract(epoch FROM clock_timestamp()) * 1000)::bigint) FROM 3);
  uuid_bytes = uuid_send(gen_random_uuid());
  uuid_bytes = overlay(uuid_bytes placing unix_ts_ms FROM 1 FOR 6);
  uuid_bytes = set_byte(uuid_bytes, 6, (b'0111' || get_byte(uuid_bytes, 6)::bit(4))::bit(8)::int);
  uuid_bytes = set_byte(uuid_bytes, 8, (b'10' || get_byte(uuid_bytes, 8)::bit(6))::bit(8)::int);
  RETURN encode(uuid_bytes, 'hex')::uuid;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- ── Enums ────────────────────────────────────────────────────

CREATE TYPE "AuthProvider" AS ENUM ('google', 'apple', 'github', 'passkey', 'magic_link', 'password');
CREATE TYPE "Plan" AS ENUM ('free', 'pro', 'business', 'agency');

-- ── Identidad ────────────────────────────────────────────────

CREATE TABLE "users" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v7(),
  "email" text NOT NULL,
  "email_verified_at" timestamptz,
  "name" text,
  "avatar_url" text,
  "two_factor_enabled" boolean NOT NULL DEFAULT false,
  "two_factor_secret" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz,
  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

CREATE TABLE "auth_methods" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v7(),
  "user_id" uuid NOT NULL,
  "provider" "AuthProvider" NOT NULL,
  "provider_account_id" text,
  "credential_public_key" bytea,
  "credential_counter" bigint,
  "password_hash" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "auth_methods_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "auth_methods_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX "auth_methods_provider_provider_account_id_key" ON "auth_methods"("provider", "provider_account_id");
CREATE INDEX "auth_methods_user_id_idx" ON "auth_methods"("user_id");

-- ── Tenancy ──────────────────────────────────────────────────

CREATE TABLE "organizations" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v7(),
  "name" text NOT NULL,
  "owner_id" uuid NOT NULL,
  "plan" "Plan" NOT NULL DEFAULT 'free',
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "organizations_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "organizations_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id")
);
CREATE INDEX "organizations_owner_id_idx" ON "organizations"("owner_id");

CREATE TABLE "workspaces" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v7(),
  "organization_id" uuid NOT NULL,
  "slug" text NOT NULL,
  "display_name" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz,
  CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "workspaces_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX "workspaces_slug_key" ON "workspaces"("slug");
CREATE INDEX "workspaces_organization_id_idx" ON "workspaces"("organization_id");

CREATE TABLE "domains" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v7(),
  "workspace_id" uuid NOT NULL,
  "hostname" text NOT NULL,
  "verification_status" text NOT NULL DEFAULT 'pending',
  "verification_token" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "domains_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "domains_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX "domains_hostname_key" ON "domains"("hostname");
CREATE INDEX "domains_workspace_id_idx" ON "domains"("workspace_id");

CREATE TABLE "roles" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v7(),
  "workspace_id" uuid,
  "name" text NOT NULL,
  "permissions" jsonb NOT NULL DEFAULT '[]',
  CONSTRAINT "roles_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "roles_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE
);
CREATE INDEX "roles_workspace_id_idx" ON "roles"("workspace_id");

CREATE TABLE "members" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v7(),
  "workspace_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "role_id" uuid NOT NULL,
  "invited_by" uuid,
  "status" text NOT NULL DEFAULT 'active',
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "members_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "members_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE,
  CONSTRAINT "members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "members_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id")
);
CREATE UNIQUE INDEX "members_workspace_id_user_id_key" ON "members"("workspace_id", "user_id");
CREATE INDEX "members_user_id_idx" ON "members"("user_id");

-- ── Páginas y temas ──────────────────────────────────────────

CREATE TABLE "themes" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v7(),
  "workspace_id" uuid,
  "name" text NOT NULL,
  "tokens" jsonb NOT NULL,
  "custom_css" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "themes_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "themes_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE
);
CREATE INDEX "themes_workspace_id_idx" ON "themes"("workspace_id");

CREATE TABLE "pages" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v7(),
  "workspace_id" uuid NOT NULL,
  "slug" text NOT NULL,
  "title" text,
  "draft_blocks" jsonb NOT NULL DEFAULT '[]',
  "published_version_id" uuid,
  "theme_id" uuid,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "pages_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "pages_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE,
  CONSTRAINT "pages_theme_id_fkey" FOREIGN KEY ("theme_id") REFERENCES "themes"("id")
);
CREATE UNIQUE INDEX "pages_workspace_id_slug_key" ON "pages"("workspace_id", "slug");
CREATE INDEX "pages_theme_id_idx" ON "pages"("theme_id");

CREATE TABLE "page_versions" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v7(),
  "page_id" uuid NOT NULL,
  "blocks" jsonb NOT NULL,
  "created_by" uuid NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "page_versions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "page_versions_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "pages"("id") ON DELETE CASCADE
);
CREATE INDEX "page_versions_page_id_idx" ON "page_versions"("page_id");

-- Ahora que "pages" existe, se pueden añadir las FKs diferidas de workspaces
ALTER TABLE "pages" ADD CONSTRAINT "pages_published_version_id_fkey"
  FOREIGN KEY ("published_version_id") REFERENCES "page_versions"("id");

-- ── Facturación de la plataforma (stub) ──────────────────────

CREATE TABLE "subscriptions" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v7(),
  "organization_id" uuid NOT NULL,
  "provider" text NOT NULL,
  "provider_subscription_id" text NOT NULL,
  "plan" text NOT NULL,
  "status" text NOT NULL,
  "current_period_end" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "subscriptions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE
);
CREATE INDEX "subscriptions_organization_id_idx" ON "subscriptions"("organization_id");

-- ── Auditoría ─────────────────────────────────────────────────

CREATE TABLE "audit_logs" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v7(),
  "workspace_id" uuid,
  "actor_id" uuid,
  "action" text NOT NULL,
  "metadata" jsonb NOT NULL DEFAULT '{}',
  "ip" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "audit_logs_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE,
  CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id")
);
CREATE INDEX "audit_logs_workspace_id_idx" ON "audit_logs"("workspace_id");
CREATE INDEX "audit_logs_actor_id_idx" ON "audit_logs"("actor_id");
