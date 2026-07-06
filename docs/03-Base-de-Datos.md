# Base de datos — LinkForge

PostgreSQL 16+. Prisma como ORM/migrador. RLS activado en todas las tablas con `workspace_id`. Convención: UUID v7 como PK (ordenable por tiempo, mejor para índices que UUID v4), `created_at`/`updated_at` en todas las tablas, soft-delete (`deleted_at`) donde el histórico importa.

## Núcleo: identidad y tenancy

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  email TEXT UNIQUE NOT NULL,
  email_verified_at TIMESTAMPTZ,
  name TEXT,
  avatar_url TEXT,
  two_factor_enabled BOOLEAN NOT NULL DEFAULT false,
  two_factor_secret TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE auth_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('google','apple','github','passkey','magic_link','password')),
  provider_account_id TEXT,
  credential_public_key BYTEA,      -- passkeys (WebAuthn)
  credential_counter BIGINT,
  password_hash TEXT,               -- solo si provider = 'password'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_account_id)
);

CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES users(id),
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free','pro','business','agency')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,         -- linkforge.com/slug
  display_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE domains (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  hostname TEXT NOT NULL UNIQUE,     -- dominio custom
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending','verified','failed')),
  verification_token TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE, -- NULL = rol de sistema
  name TEXT NOT NULL,                -- owner, admin, editor, viewer, custom...
  permissions JSONB NOT NULL DEFAULT '[]'  -- lista de permission keys (ABAC)
);

CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id),
  invited_by UUID REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('invited','active','suspended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, user_id)
);

ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON workspaces
  USING (id = current_setting('app.current_workspace_id')::uuid);
-- (política equivalente se aplica a cada tabla con workspace_id, generada por script de migración)
```

## Páginas, bloques y temas

```sql
CREATE TABLE pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,                -- página raíz = ''
  title TEXT,
  published_version_id UUID,         -- FK diferida a page_versions
  draft_version_id UUID,
  theme_id UUID REFERENCES themes(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, slug)
);

CREATE TABLE page_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  blocks JSONB NOT NULL,             -- snapshot inmutable: [{id,type,order,config}]
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE themes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE, -- NULL = tema del sistema
  name TEXT NOT NULL,
  tokens JSONB NOT NULL,             -- colores, fuentes, radios, sombras (CSS variables)
  custom_css TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

## Analítica (escritura append-only + agregados)

```sql
-- tabla particionada por rango de fecha (mensual) — alto volumen de escritura
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  workspace_id UUID NOT NULL,
  page_id UUID,
  block_id TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN ('view','click','conversion')),
  country TEXT, city TEXT, language TEXT,
  device TEXT, os TEXT, browser TEXT,
  referer TEXT, utm_source TEXT, utm_medium TEXT, utm_campaign TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
) PARTITION BY RANGE (occurred_at);

-- vista materializada de agregados diarios, refrescada por worker
CREATE MATERIALIZED VIEW analytics_daily_rollup AS
SELECT workspace_id, page_id, date_trunc('day', occurred_at) AS day,
       event_type, count(*) AS total
FROM analytics_events
GROUP BY 1,2,3,4;
```

## Comercio (Fase B)

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('digital','physical','booking','donation','subscription')),
  price_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  buyer_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','refunded','failed')),
  total_cents INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  order_id UUID NOT NULL REFERENCES orders(id),
  provider TEXT NOT NULL CHECK (provider IN ('stripe','paypal','paddle','lemonsqueezy')),
  provider_payment_id TEXT NOT NULL,
  status TEXT NOT NULL,
  raw_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

## Automatización y plugins (Fase C)

```sql
CREATE TABLE workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  trigger JSONB NOT NULL,            -- { type, config }
  steps JSONB NOT NULL,              -- [{ type: condition|action|wait|loop, config }]
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE workflow_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('queued','running','succeeded','failed')),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  error TEXT
);

CREATE TABLE plugin_installations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  plugin_key TEXT NOT NULL,          -- 'stripe', 'mailchimp', 'zapier'...
  config_encrypted BYTEA NOT NULL,   -- cifrado con clave por tenant (KMS)
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','error')),
  installed_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, plugin_key)
);
```

## Facturación de la plataforma

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('stripe','paddle')),
  provider_subscription_id TEXT NOT NULL,
  plan TEXT NOT NULL,
  status TEXT NOT NULL,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

## Índices críticos (rendimiento)

```sql
CREATE INDEX idx_pages_workspace ON pages(workspace_id);
CREATE INDEX idx_analytics_workspace_day ON analytics_events(workspace_id, occurred_at);
CREATE INDEX idx_members_user ON members(user_id);
CREATE INDEX idx_orders_workspace_status ON orders(workspace_id, status);
CREATE INDEX idx_workflow_runs_workflow ON workflow_runs(workflow_id, status);
```

**Nota de escalabilidad:** `analytics_events` es la tabla que crecerá más rápido — particionada por mes desde el día 1 y con política de retención (ej. detalle crudo 90 días, luego solo agregados) para no degradar el resto de la base de datos.
