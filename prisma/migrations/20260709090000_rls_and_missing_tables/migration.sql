-- LinkForge — RLS real + tablas que faltaban en la migración inicial
-- Escrita a mano: el motor de Prisma no se pudo descargar en este entorno
-- (binaries.prisma.sh bloqueado por red — mismo problema documentado en
-- docs/11-Auditoria-Produccion.md). NO SE HA PODIDO APLICAR NI VERIFICAR
-- contra un Postgres real desde este entorno. Antes de fiarte de esto en
-- producción:
--   1. `docker compose up` en una máquina con red normal.
--   2. `npx prisma migrate deploy` (o `dev` si aún no está en prod).
--   3. Crear DOS workspaces de prueba con datos distintos y verificar a
--      mano que ninguno ve los datos del otro, y que ambos siguen viendo
--      los suyos (páginas, temas, editor).
--   4. Verificar que la página pública (GET /public/pages/:slug) sigue
--      funcionando para un visitante anónimo sin sesión de workspace.
--   5. Solo entonces, desplegar a producción.

-- ============================================================
-- 1. Tabla que faltaba: analytics_events
-- ============================================================
-- El endpoint POST /public/events (public-pages.controller.ts) hace INSERT
-- INTO analytics_events desde el principio, pero esta tabla NUNCA se creó
-- en la migración inicial. Cada llamada a ese endpoint fallaba con
-- "relation analytics_events does not exist". Bug real, no solo teórico.

CREATE TABLE "analytics_events" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v7(),
  "workspace_id" uuid NOT NULL,
  "block_id" uuid,
  "event_type" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "analytics_events_workspace_id_fkey" FOREIGN KEY ("workspace_id")
    REFERENCES "workspaces"("id") ON DELETE CASCADE
);
CREATE INDEX "analytics_events_workspace_id_idx" ON "analytics_events"("workspace_id");

-- ============================================================
-- 2. Recuperación de contraseña
-- ============================================================

CREATE TABLE "password_reset_tokens" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v7(),
  "user_id" uuid NOT NULL,
  "token_hash" text NOT NULL,
  "expires_at" timestamptz NOT NULL,
  "used_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id")
    REFERENCES "users"("id") ON DELETE CASCADE
);
CREATE INDEX "password_reset_tokens_user_id_idx" ON "password_reset_tokens"("user_id");
CREATE INDEX "password_reset_tokens_token_hash_idx" ON "password_reset_tokens"("token_hash");

-- ============================================================
-- 3. Invitaciones a workspace para emails sin cuenta todavía
-- ============================================================
-- Antes, InviteMemberUseCase lanzaba NotFoundException si el invitado no
-- tenía cuenta — imposible invitar a nadie que no se hubiera registrado ya.

CREATE TABLE "workspace_invitations" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v7(),
  "workspace_id" uuid NOT NULL,
  "email" text NOT NULL,
  "role_id" uuid NOT NULL,
  "invited_by" uuid NOT NULL,
  "status" text NOT NULL DEFAULT 'pending',
  "expires_at" timestamptz NOT NULL,
  "accepted_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "workspace_invitations_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "workspace_invitations_workspace_id_fkey" FOREIGN KEY ("workspace_id")
    REFERENCES "workspaces"("id") ON DELETE CASCADE,
  CONSTRAINT "workspace_invitations_role_id_fkey" FOREIGN KEY ("role_id")
    REFERENCES "roles"("id")
);
CREATE UNIQUE INDEX "workspace_invitations_workspace_id_email_key"
  ON "workspace_invitations"("workspace_id", "email");
CREATE INDEX "workspace_invitations_email_idx" ON "workspace_invitations"("email");

-- ============================================================
-- 4. RLS real — activación (ver docs/rls-policies-reference.sql, que
--    documentaba por qué NO se podía activar todavía)
-- ============================================================
-- Diferencias respecto a la referencia original:
--   a) set_config() se llama parametrizado desde la app (ver
--      PrismaService.withWorkspace) — ya no hay riesgo de inyección SQL
--      en el valor de workspace_id.
--   b) FORCE ROW LEVEL SECURITY: sin esto, si la conexión de la app usa
--      el mismo rol que es OWNER de las tablas (caso típico con un solo
--      usuario de BD gestionado por Render/Railway/etc.), Postgres deja
--      pasar al dueño de la tabla SIN aplicar RLS — la política existiría
--      pero no haría absolutamente nada. Esto es fácil de pasar por alto
--      y anularía todo el propósito de este cambio.
--   c) Política adicional de lectura pública para pages/page_versions:
--      el endpoint público (GET /public/pages/:slug) lee estas tablas SIN
--      contexto de workspace (un visitante anónimo no tiene sesión de
--      tenant) — sin esta política, activar RLS habría roto la página
--      pública para todo el mundo.
--   d) roles y members NO se incluyen aquí a propósito: varias queries
--      (ej. "listar mis workspaces", donde un usuario pertenece a varios)
--      son legítimamente cross-tenant y necesitan una segunda variable de
--      sesión (app.current_user_id) que todavía no existe en el código.
--      Aplicar RLS estricto ahí con el diseño actual rompería esas queries
--      en vez de protegerlas. Queda documentado como siguiente paso, no
--      como descuido.

-- pages: aislamiento estricto por tenant + lectura pública si está publicada
ALTER TABLE "pages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "pages" FORCE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_pages" ON "pages"
  FOR ALL
  USING (workspace_id = NULLIF(current_setting('app.current_workspace_id', true), '')::uuid)
  WITH CHECK (workspace_id = NULLIF(current_setting('app.current_workspace_id', true), '')::uuid);

CREATE POLICY "public_read_published_pages" ON "pages"
  FOR SELECT
  USING (published_version_id IS NOT NULL);

-- page_versions: no tiene workspace_id directo, cruza a pages
ALTER TABLE "page_versions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "page_versions" FORCE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_page_versions" ON "page_versions"
  FOR ALL
  USING (
    page_id IN (
      SELECT id FROM "pages"
      WHERE workspace_id = NULLIF(current_setting('app.current_workspace_id', true), '')::uuid
    )
  )
  WITH CHECK (
    page_id IN (
      SELECT id FROM "pages"
      WHERE workspace_id = NULLIF(current_setting('app.current_workspace_id', true), '')::uuid
    )
  );

CREATE POLICY "public_read_published_versions" ON "page_versions"
  FOR SELECT
  USING (id IN (SELECT published_version_id FROM "pages" WHERE published_version_id IS NOT NULL));

-- themes: workspace_id NULL = tema de sistema, visible desde cualquier
-- contexto sin necesitar SET
ALTER TABLE "themes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "themes" FORCE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_themes" ON "themes"
  FOR ALL
  USING (
    workspace_id IS NULL
    OR workspace_id = NULLIF(current_setting('app.current_workspace_id', true), '')::uuid
  )
  WITH CHECK (
    workspace_id IS NULL
    OR workspace_id = NULLIF(current_setting('app.current_workspace_id', true), '')::uuid
  );

-- domains: sin repositorio/uso real en el código todavía — se activa de
-- forma preventiva para que nadie la use accidentalmente sin RLS mañana.
ALTER TABLE "domains" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "domains" FORCE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_domains" ON "domains"
  FOR ALL
  USING (workspace_id = NULLIF(current_setting('app.current_workspace_id', true), '')::uuid)
  WITH CHECK (workspace_id = NULLIF(current_setting('app.current_workspace_id', true), '')::uuid);

-- analytics_events: lectura restringida al tenant, pero la escritura es
-- deliberadamente pública — la dispara cualquier visitante anónimo viendo
-- una página pública, no tiene sentido exigirle una sesión de workspace.
ALTER TABLE "analytics_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "analytics_events" FORCE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_analytics_events" ON "analytics_events"
  FOR ALL
  USING (workspace_id = NULLIF(current_setting('app.current_workspace_id', true), '')::uuid)
  WITH CHECK (workspace_id = NULLIF(current_setting('app.current_workspace_id', true), '')::uuid);

CREATE POLICY "public_insert_analytics_events" ON "analytics_events"
  FOR INSERT
  WITH CHECK (true);

-- audit_logs: se deja explícitamente SIN RLS, igual que en la referencia
-- original — un panel de administración de plataforma necesita ver logs
-- de todos los workspaces. Decisión explícita, no omisión.
