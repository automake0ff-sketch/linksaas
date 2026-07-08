-- ============================================================
-- REFERENCIA DE POLÍTICAS RLS — NO APLICAR TODAVÍA
-- ============================================================
-- Este archivo NO está en prisma/migrations/ a propósito: si estuviera ahí,
-- `prisma migrate deploy` lo aplicaría automáticamente en el próximo
-- despliegue y ROMPERÍA LA APLICACIÓN ENTERA.
--
-- Por qué: estas políticas exigen que la sesión de Postgres tenga fijado
-- `app.current_workspace_id` (vía SET LOCAL). Hoy, NINGÚN repositorio del
-- código pasa por PrismaService.withWorkspace() — todos hacen
-- `this.prisma.<modelo>.<método>()` directo. Si esta política se activa,
-- `current_setting('app.current_workspace_id', true)` devuelve NULL en
-- cada request real, y `workspace_id = NULL` nunca es verdadero → todas
-- las consultas de la aplicación devolverían 0 filas. No es una advertencia
-- teórica: se comprobó de esta forma durante la auditoría (ver
-- docs/11-Auditoria-Produccion.md, hallazgo #1).
--
-- ORDEN CORRECTO para activar esto en el futuro:
--   1. Refactorizar cada repositorio Prisma de un módulo con datos de
--      tenant (pages, themes, tenancy) para recibir el PrismaClient de la
--      transacción (tx) en vez de usar `this.prisma` directamente — algo
--      como un interceptor de Nest que abra la transacción por request
--      autenticada y la inyecte via un provider request-scoped, o
--      AsyncLocalStorage.
--   2. Escribir un test de integración que falle si CUALQUIER query de un
--      repositorio de tenant se ejecuta fuera de ese contexto.
--   3. Solo entonces, mover este archivo a prisma/migrations/ y aplicarlo.
--   4. Verificar en staging con dos workspaces de prueba que ninguno ve
--      datos del otro Y que ambos siguen viendo los suyos.

ALTER TABLE domains ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_domains ON domains
  USING (workspace_id = current_setting('app.current_workspace_id', true)::uuid);

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_roles ON roles
  USING (workspace_id IS NULL OR workspace_id = current_setting('app.current_workspace_id', true)::uuid);
  -- workspace_id IS NULL = rol de sistema, visible desde cualquier workspace

ALTER TABLE members ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_members ON members
  USING (workspace_id = current_setting('app.current_workspace_id', true)::uuid);

ALTER TABLE themes ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_themes ON themes
  USING (workspace_id IS NULL OR workspace_id = current_setting('app.current_workspace_id', true)::uuid);

ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_pages ON pages
  USING (workspace_id = current_setting('app.current_workspace_id', true)::uuid);

-- page_versions no tiene workspace_id directo — la política cruza a pages.
ALTER TABLE page_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_page_versions ON page_versions
  USING (
    page_id IN (
      SELECT id FROM pages
      WHERE workspace_id = current_setting('app.current_workspace_id', true)::uuid
    )
  );

-- audit_logs: workspace_id nullable (logs de plataforma sin workspace) —
-- esta tabla probablemente NO debería tener RLS por workspace en absoluto
-- (el panel de administración de la plataforma necesita ver logs de todos
-- los workspaces); se documenta aquí para que quede la decisión explícita
-- en vez de aplicarse por inercia junto con el resto.
