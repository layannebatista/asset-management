-- ============================================================
-- V1: Schema base original + dados de demonstração
-- Removidas apenas as tabelas/colunas já cobertas por V2-V7:
--   V2: asset_assignment_history, asset_status_history
--   V3: ALTER users DROP NOT NULL password_hash
--   V4: asset_categories
--   V5: users.phone_number, mfa_codes
--   V6: refresh_tokens, maintenance_records.estimated_cost/actual_cost,
--       assets.purchase_date/invoice_number/invoice_date/supplier/warranty_expiry
--   V7: cost_centers, asset_insurance,
--       assets.purchase_value/residual_value/useful_life_months/depreciation_method/cost_center_id,
--       maintenance_records.cost_center_id
-- ============================================================

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;
SET default_tablespace = '';
SET default_table_access_method = heap;

-- Garante compatibilidade em CI/teste quando o role esperado ainda nao existe.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'asset_user') THEN
        CREATE ROLE asset_user;
    END IF;
END
$$;

-- ============================================================
-- ORGANIZATIONS
-- ============================================================
CREATE TABLE public.organizations (
    id bigint NOT NULL,
    status character varying(20) NOT NULL,
    name character varying(255) NOT NULL,
    CONSTRAINT organizations_status_check CHECK (((status)::text = ANY ((ARRAY['ACTIVE'::character varying, 'INACTIVE'::character varying])::text[])))
);

ALTER TABLE public.organizations OWNER TO asset_user;

CREATE SEQUENCE public.organizations_id_seq
    START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

ALTER SEQUENCE public.organizations_id_seq OWNER TO asset_user;
ALTER SEQUENCE public.organizations_id_seq OWNED BY public.organizations.id;
ALTER TABLE ONLY public.organizations ALTER COLUMN id SET DEFAULT nextval('public.organizations_id_seq'::regclass);
ALTER TABLE ONLY public.organizations ADD CONSTRAINT organizations_name_key UNIQUE (name);
ALTER TABLE ONLY public.organizations ADD CONSTRAINT organizations_pkey PRIMARY KEY (id);

-- ============================================================
-- UNITS
-- ============================================================
CREATE TABLE public.units (
    is_main boolean NOT NULL,
    id bigint NOT NULL,
    organization_id bigint NOT NULL,
    status character varying(20) NOT NULL,
    name character varying(255) NOT NULL,
    CONSTRAINT units_status_check CHECK (((status)::text = ANY ((ARRAY['ACTIVE'::character varying, 'INACTIVE'::character varying])::text[])))
);

ALTER TABLE public.units OWNER TO asset_user;

CREATE SEQUENCE public.units_id_seq
    START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

ALTER SEQUENCE public.units_id_seq OWNER TO asset_user;
ALTER SEQUENCE public.units_id_seq OWNED BY public.units.id;
ALTER TABLE ONLY public.units ALTER COLUMN id SET DEFAULT nextval('public.units_id_seq'::regclass);
ALTER TABLE ONLY public.units ADD CONSTRAINT units_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.units ADD CONSTRAINT fkikrjcta3kxqs8scto8s6t4wv0 FOREIGN KEY (organization_id) REFERENCES public.organizations(id);

-- ============================================================
-- USERS
-- (phone_number adicionado no V5, password_hash nullable no V3)
-- ============================================================
CREATE TABLE public.users (
    lgpd_accepted boolean NOT NULL,
    id bigint NOT NULL,
    organization_id bigint NOT NULL,
    unit_id bigint NOT NULL,
    version bigint NOT NULL,
    document_number character varying(50) NOT NULL,
    role character varying(50) NOT NULL,
    status character varying(50) NOT NULL,
    email character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['ADMIN'::character varying, 'GESTOR'::character varying, 'OPERADOR'::character varying])::text[]))),
    CONSTRAINT users_status_check CHECK (((status)::text = ANY ((ARRAY['PENDING_ACTIVATION'::character varying, 'ACTIVE'::character varying, 'BLOCKED'::character varying, 'INACTIVE'::character varying])::text[])))
);

ALTER TABLE public.users OWNER TO asset_user;

CREATE SEQUENCE public.users_id_seq
    START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

ALTER SEQUENCE public.users_id_seq OWNER TO asset_user;
ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;
ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);
ALTER TABLE ONLY public.users ADD CONSTRAINT users_email_key UNIQUE (email);
ALTER TABLE ONLY public.users ADD CONSTRAINT users_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.users ADD CONSTRAINT fkp2hfld4bhbwtakwrmt4xq6een FOREIGN KEY (unit_id) REFERENCES public.units(id);
ALTER TABLE ONLY public.users ADD CONSTRAINT fkqpugllwvyv37klq7ft9m8aqxk FOREIGN KEY (organization_id) REFERENCES public.organizations(id);

-- ============================================================
-- USER_CONSENTS
-- ============================================================
CREATE TABLE public.user_consents (
    lgpd_accepted boolean NOT NULL,
    accepted_at timestamp(6) with time zone NOT NULL,
    id bigint NOT NULL,
    user_id bigint NOT NULL
);

ALTER TABLE public.user_consents OWNER TO asset_user;

CREATE SEQUENCE public.user_consents_id_seq
    START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

ALTER SEQUENCE public.user_consents_id_seq OWNER TO asset_user;
ALTER SEQUENCE public.user_consents_id_seq OWNED BY public.user_consents.id;
ALTER TABLE ONLY public.user_consents ALTER COLUMN id SET DEFAULT nextval('public.user_consents_id_seq'::regclass);
ALTER TABLE ONLY public.user_consents ADD CONSTRAINT user_consents_pkey PRIMARY KEY (id);

-- ============================================================
-- USER_ACTIVATION_TOKENS
-- ============================================================
CREATE TABLE public.user_activation_tokens (
    used boolean NOT NULL,
    created_at timestamp(6) with time zone NOT NULL,
    expires_at timestamp(6) with time zone NOT NULL,
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    token character varying(100) NOT NULL
);

ALTER TABLE public.user_activation_tokens OWNER TO asset_user;

CREATE SEQUENCE public.user_activation_tokens_id_seq
    START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

ALTER SEQUENCE public.user_activation_tokens_id_seq OWNER TO asset_user;
ALTER SEQUENCE public.user_activation_tokens_id_seq OWNED BY public.user_activation_tokens.id;
ALTER TABLE ONLY public.user_activation_tokens ALTER COLUMN id SET DEFAULT nextval('public.user_activation_tokens_id_seq'::regclass);
ALTER TABLE ONLY public.user_activation_tokens ADD CONSTRAINT user_activation_tokens_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.user_activation_tokens ADD CONSTRAINT user_activation_tokens_token_key UNIQUE (token);
ALTER TABLE ONLY public.user_activation_tokens ADD CONSTRAINT fkn3ecsoid6jap5yyfk5llb2s06 FOREIGN KEY (user_id) REFERENCES public.users(id);

-- ============================================================
-- ASSETS
-- (colunas financeiras/fiscais adicionadas em V6 e V7)
-- ============================================================
CREATE TABLE public.assets (
    id bigint NOT NULL,
    organization_id bigint NOT NULL,
    unit_id bigint NOT NULL,
    user_id bigint,
    version bigint NOT NULL,
    asset_tag character varying(255) NOT NULL,
    model character varying(255) NOT NULL,
    status character varying(255) NOT NULL,
    type character varying(255) NOT NULL,
    CONSTRAINT assets_status_check CHECK (((status)::text = ANY ((ARRAY['AVAILABLE'::character varying, 'ASSIGNED'::character varying, 'IN_TRANSFER'::character varying, 'IN_MAINTENANCE'::character varying, 'UNAVAILABLE'::character varying, 'RETIRED'::character varying])::text[]))),
    CONSTRAINT assets_type_check CHECK (((type)::text = ANY ((ARRAY['MOBILE_PHONE'::character varying, 'NOTEBOOK'::character varying, 'TABLET'::character varying, 'DESKTOP'::character varying, 'VEHICLE'::character varying, 'OTHER'::character varying])::text[])))
);

ALTER TABLE public.assets OWNER TO asset_user;

CREATE SEQUENCE public.assets_id_seq
    START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

ALTER SEQUENCE public.assets_id_seq OWNER TO asset_user;
ALTER SEQUENCE public.assets_id_seq OWNED BY public.assets.id;
ALTER TABLE ONLY public.assets ALTER COLUMN id SET DEFAULT nextval('public.assets_id_seq'::regclass);
ALTER TABLE ONLY public.assets ADD CONSTRAINT assets_asset_tag_key UNIQUE (asset_tag);
ALTER TABLE ONLY public.assets ADD CONSTRAINT assets_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.assets ADD CONSTRAINT fkgqxc5up08htqakpryiaod3ujs FOREIGN KEY (organization_id) REFERENCES public.organizations(id);
ALTER TABLE ONLY public.assets ADD CONSTRAINT fkhw0fyx6bf4c907lgsksy86vix FOREIGN KEY (unit_id) REFERENCES public.units(id);
ALTER TABLE ONLY public.assets ADD CONSTRAINT fki37wgdksbwub2fd1g8orrh975 FOREIGN KEY (user_id) REFERENCES public.users(id);

-- ============================================================
-- AUDIT_EVENTS
-- ============================================================
CREATE TABLE public.audit_events (
    actor_user_id bigint,
    created_at timestamp(6) with time zone NOT NULL,
    id bigint NOT NULL,
    organization_id bigint NOT NULL,
    target_id bigint,
    unit_id bigint,
    target_type character varying(100),
    details text,
    type character varying(255) NOT NULL,
    CONSTRAINT audit_events_type_check CHECK (((type)::text = ANY ((ARRAY['ORGANIZATION_CREATED'::character varying, 'ORGANIZATION_STATUS_CHANGED'::character varying, 'ORGANIZATION_UPDATED'::character varying, 'ORGANIZATION_ACTIVATED'::character varying, 'ORGANIZATION_INACTIVATED'::character varying, 'UNIT_CREATED'::character varying, 'UNIT_STATUS_CHANGED'::character varying, 'UNIT_UPDATED'::character varying, 'UNIT_ACTIVATED'::character varying, 'UNIT_INACTIVATED'::character varying, 'USER_CREATED'::character varying, 'USER_STATUS_CHANGED'::character varying, 'USER_LGPD_ACCEPTED'::character varying, 'USER_UPDATED'::character varying, 'USER_ACTIVATED'::character varying, 'USER_INACTIVATED'::character varying, 'ASSET_CREATED'::character varying, 'ASSET_ASSIGNED'::character varying, 'ASSET_UNASSIGNED'::character varying, 'ASSET_TRANSFERRED'::character varying, 'ASSET_STATUS_CHANGED'::character varying, 'ASSET_RETIRED'::character varying, 'ASSET_UPDATED'::character varying])::text[])))
);

ALTER TABLE public.audit_events OWNER TO asset_user;

CREATE SEQUENCE public.audit_events_id_seq
    START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

ALTER SEQUENCE public.audit_events_id_seq OWNER TO asset_user;
ALTER SEQUENCE public.audit_events_id_seq OWNED BY public.audit_events.id;
ALTER TABLE ONLY public.audit_events ALTER COLUMN id SET DEFAULT nextval('public.audit_events_id_seq'::regclass);
ALTER TABLE ONLY public.audit_events ADD CONSTRAINT audit_events_pkey PRIMARY KEY (id);

CREATE INDEX idx_audit_actor ON public.audit_events USING btree (actor_user_id);
CREATE INDEX idx_audit_created_at ON public.audit_events USING btree (created_at);
CREATE INDEX idx_audit_org ON public.audit_events USING btree (organization_id);
CREATE INDEX idx_audit_target ON public.audit_events USING btree (target_id);
CREATE INDEX idx_audit_type ON public.audit_events USING btree (type);

-- ============================================================
-- MAINTENANCE_RECORDS
-- (estimated_cost, actual_cost adicionados no V6)
-- (cost_center_id adicionado no V7)
-- ============================================================
CREATE TABLE public.maintenance_records (
    asset_id bigint NOT NULL,
    completed_at timestamp(6) with time zone,
    completed_by_user_id bigint,
    created_at timestamp(6) with time zone NOT NULL,
    id bigint NOT NULL,
    organization_id bigint NOT NULL,
    requested_by_user_id bigint NOT NULL,
    started_at timestamp(6) with time zone,
    started_by_user_id bigint,
    unit_id bigint NOT NULL,
    version bigint NOT NULL,
    description text NOT NULL,
    resolution text,
    status character varying(255) NOT NULL,
    CONSTRAINT maintenance_records_status_check CHECK (((status)::text = ANY ((ARRAY['REQUESTED'::character varying, 'IN_PROGRESS'::character varying, 'COMPLETED'::character varying, 'CANCELLED'::character varying])::text[])))
);

ALTER TABLE public.maintenance_records OWNER TO asset_user;

CREATE SEQUENCE public.maintenance_records_id_seq
    START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

ALTER SEQUENCE public.maintenance_records_id_seq OWNER TO asset_user;
ALTER SEQUENCE public.maintenance_records_id_seq OWNED BY public.maintenance_records.id;
ALTER TABLE ONLY public.maintenance_records ALTER COLUMN id SET DEFAULT nextval('public.maintenance_records_id_seq'::regclass);
ALTER TABLE ONLY public.maintenance_records ADD CONSTRAINT maintenance_records_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.maintenance_records ADD CONSTRAINT fk124fjg43i0s5luwopsoq78k9h FOREIGN KEY (asset_id) REFERENCES public.assets(id);

CREATE INDEX idx_maintenance_asset ON public.maintenance_records USING btree (asset_id);
CREATE INDEX idx_maintenance_org ON public.maintenance_records USING btree (organization_id);
CREATE INDEX idx_maintenance_status ON public.maintenance_records USING btree (status);

-- ============================================================
-- TRANSFER_REQUESTS
-- ============================================================
CREATE TABLE public.transfer_requests (
    approved_at timestamp(6) with time zone,
    approved_by bigint,
    asset_id bigint NOT NULL,
    completed_at timestamp(6) with time zone,
    from_unit_id bigint NOT NULL,
    id bigint NOT NULL,
    requested_at timestamp(6) with time zone NOT NULL,
    requested_by bigint NOT NULL,
    to_unit_id bigint NOT NULL,
    version bigint NOT NULL,
    status character varying(30) NOT NULL,
    reason character varying(500) NOT NULL,
    CONSTRAINT transfer_requests_status_check CHECK (((status)::text = ANY ((ARRAY['PENDING'::character varying, 'APPROVED'::character varying, 'REJECTED'::character varying, 'COMPLETED'::character varying, 'CANCELLED'::character varying])::text[])))
);

ALTER TABLE public.transfer_requests OWNER TO asset_user;

CREATE SEQUENCE public.transfer_requests_id_seq
    START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

ALTER SEQUENCE public.transfer_requests_id_seq OWNER TO asset_user;
ALTER SEQUENCE public.transfer_requests_id_seq OWNED BY public.transfer_requests.id;
ALTER TABLE ONLY public.transfer_requests ALTER COLUMN id SET DEFAULT nextval('public.transfer_requests_id_seq'::regclass);
ALTER TABLE ONLY public.transfer_requests ADD CONSTRAINT transfer_requests_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.transfer_requests ADD CONSTRAINT fk4h44hvojk5yaqj12lkqd2g4r3 FOREIGN KEY (from_unit_id) REFERENCES public.units(id);
ALTER TABLE ONLY public.transfer_requests ADD CONSTRAINT fka8k9c199befjiccignbbup4oq FOREIGN KEY (requested_by) REFERENCES public.users(id);
ALTER TABLE ONLY public.transfer_requests ADD CONSTRAINT fkgmm8r1l1ru8jc9q8pkc4uvdy0 FOREIGN KEY (to_unit_id) REFERENCES public.units(id);
ALTER TABLE ONLY public.transfer_requests ADD CONSTRAINT fkh7lp26n09l4kppiodawcfqtn3 FOREIGN KEY (asset_id) REFERENCES public.assets(id);
ALTER TABLE ONLY public.transfer_requests ADD CONSTRAINT fkr9lol8x40lsy5g7pgot27rc9i FOREIGN KEY (approved_by) REFERENCES public.users(id);

-- ============================================================
-- INVENTORY_SESSIONS
-- ============================================================
CREATE TABLE public.inventory_sessions (
    closed_at timestamp(6) with time zone,
    created_at timestamp(6) with time zone NOT NULL,
    created_by bigint NOT NULL,
    id bigint NOT NULL,
    organization_id bigint NOT NULL,
    unit_id bigint NOT NULL,
    version bigint NOT NULL,
    status character varying(255) NOT NULL,
    CONSTRAINT inventory_sessions_status_check CHECK (((status)::text = ANY ((ARRAY['OPEN'::character varying, 'IN_PROGRESS'::character varying, 'CLOSED'::character varying, 'CANCELLED'::character varying])::text[])))
);

ALTER TABLE public.inventory_sessions OWNER TO asset_user;

CREATE SEQUENCE public.inventory_sessions_id_seq
    START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

ALTER SEQUENCE public.inventory_sessions_id_seq OWNER TO asset_user;
ALTER SEQUENCE public.inventory_sessions_id_seq OWNED BY public.inventory_sessions.id;
ALTER TABLE ONLY public.inventory_sessions ALTER COLUMN id SET DEFAULT nextval('public.inventory_sessions_id_seq'::regclass);
ALTER TABLE ONLY public.inventory_sessions ADD CONSTRAINT inventory_sessions_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.inventory_sessions ADD CONSTRAINT fk10xefx40fb9ths30upadsd7b3 FOREIGN KEY (created_by) REFERENCES public.users(id);
ALTER TABLE ONLY public.inventory_sessions ADD CONSTRAINT fk3ymvgn6pb0pwqd9ho33n9pa5t FOREIGN KEY (unit_id) REFERENCES public.units(id);
ALTER TABLE ONLY public.inventory_sessions ADD CONSTRAINT fkmc3t60rxg9lpya5tlx6drg8ea FOREIGN KEY (organization_id) REFERENCES public.organizations(id);

CREATE INDEX idx_inventory_session_org ON public.inventory_sessions USING btree (organization_id);
CREATE INDEX idx_inventory_session_status ON public.inventory_sessions USING btree (status);
CREATE INDEX idx_inventory_session_unit ON public.inventory_sessions USING btree (unit_id);

-- ============================================================
-- INVENTORY_ITEMS
-- ============================================================
CREATE TABLE public.inventory_items (
    present boolean NOT NULL,
    asset_id bigint NOT NULL,
    id bigint NOT NULL,
    session_id bigint NOT NULL
);

ALTER TABLE public.inventory_items OWNER TO asset_user;

CREATE SEQUENCE public.inventory_items_id_seq
    START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

ALTER SEQUENCE public.inventory_items_id_seq OWNER TO asset_user;
ALTER SEQUENCE public.inventory_items_id_seq OWNED BY public.inventory_items.id;
ALTER TABLE ONLY public.inventory_items ALTER COLUMN id SET DEFAULT nextval('public.inventory_items_id_seq'::regclass);
ALTER TABLE ONLY public.inventory_items ADD CONSTRAINT inventory_items_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.inventory_items ADD CONSTRAINT uk_inventory_session_asset UNIQUE (session_id, asset_id);
ALTER TABLE ONLY public.inventory_items ADD CONSTRAINT fkiqbpoogrouq26yw5fhqjx59jw FOREIGN KEY (session_id) REFERENCES public.inventory_sessions(id);
ALTER TABLE ONLY public.inventory_items ADD CONSTRAINT fkkg7jexwtdc1ndrh5rffkc2e39 FOREIGN KEY (asset_id) REFERENCES public.assets(id);

CREATE INDEX idx_inventory_item_asset ON public.inventory_items USING btree (asset_id);
CREATE INDEX idx_inventory_item_session ON public.inventory_items USING btree (session_id);

-- ============================================================
-- DADOS DE DEMONSTRAÇÃO
-- ============================================================

-- 1. ORGANIZAÇÃO
INSERT INTO public.organizations (name, status)
VALUES ('Empresa Demo Ltda', 'ACTIVE')
ON CONFLICT (name) DO NOTHING;

-- 2. UNIDADES
INSERT INTO public.units (name, status, is_main, organization_id)
SELECT 'Matriz SP', 'ACTIVE', true, id FROM public.organizations WHERE name = 'Empresa Demo Ltda'
ON CONFLICT DO NOTHING;

INSERT INTO public.units (name, status, is_main, organization_id)
SELECT 'Filial RJ', 'ACTIVE', false, id FROM public.organizations WHERE name = 'Empresa Demo Ltda'
ON CONFLICT DO NOTHING;

INSERT INTO public.units (name, status, is_main, organization_id)
SELECT 'Filial BH', 'ACTIVE', false, id FROM public.organizations WHERE name = 'Empresa Demo Ltda'
ON CONFLICT DO NOTHING;

-- 3. USUÁRIOS DEMO
-- password_hash = 'SEED_PENDING' → será substituído pelo DataSeeder no startup
-- O DataSeeder gera o hash BCrypt correto via Spring PasswordEncoder

-- ADMIN
INSERT INTO public.users (
    name, email, document_number, role, status,
    organization_id, unit_id, lgpd_accepted, password_hash, version
)
SELECT
    'Administrador Sistema',
    'admin@empresa.com',
    '000.000.000-01',
    'ADMIN',
    'ACTIVE',
    o.id,
    u.id,
    true,
    'SEED_PENDING',
    0
FROM public.organizations o
JOIN public.units u ON u.organization_id = o.id AND u.name = 'Matriz SP'
WHERE o.name = 'Empresa Demo Ltda'
ON CONFLICT (email) DO NOTHING;

-- GESTOR
INSERT INTO public.users (
    name, email, document_number, role, status,
    organization_id, unit_id, lgpd_accepted, password_hash, version
)
SELECT
    'Gestor Filial RJ',
    'gestor@empresa.com',
    '000.000.000-02',
    'GESTOR',
    'ACTIVE',
    o.id,
    u.id,
    true,
    'SEED_PENDING',
    0
FROM public.organizations o
JOIN public.units u ON u.organization_id = o.id AND u.name = 'Filial RJ'
WHERE o.name = 'Empresa Demo Ltda'
ON CONFLICT (email) DO NOTHING;

-- OPERADOR
INSERT INTO public.users (
    name, email, document_number, role, status,
    organization_id, unit_id, lgpd_accepted, password_hash, version
)
SELECT
    'Operador Filial BH',
    'operador@empresa.com',
    '000.000.000-03',
    'OPERADOR',
    'ACTIVE',
    o.id,
    u.id,
    true,
    'SEED_PENDING',
    0
FROM public.organizations o
JOIN public.units u ON u.organization_id = o.id AND u.name = 'Filial BH'
WHERE o.name = 'Empresa Demo Ltda'
ON CONFLICT (email) DO NOTHING;

-- 4. CONSENTIMENTOS LGPD
INSERT INTO public.user_consents (lgpd_accepted, accepted_at, user_id)
SELECT true, NOW(), id FROM public.users WHERE email = 'admin@empresa.com'
ON CONFLICT DO NOTHING;

INSERT INTO public.user_consents (lgpd_accepted, accepted_at, user_id)
SELECT true, NOW(), id FROM public.users WHERE email = 'gestor@empresa.com'
ON CONFLICT DO NOTHING;

INSERT INTO public.user_consents (lgpd_accepted, accepted_at, user_id)
SELECT true, NOW(), id FROM public.users WHERE email = 'operador@empresa.com'
ON CONFLICT DO NOTHING;

-- 5. ATIVOS DE DEMONSTRAÇÃO
-- (colunas financeiras serão adicionadas pelo V6/V7 antes dos INSERTs)
INSERT INTO public.assets (asset_tag, type, model, status, organization_id, unit_id, user_id, version)
SELECT 'ASSET-DEMO-001', 'NOTEBOOK', 'Dell Latitude 5520', 'AVAILABLE', o.id, u.id, NULL, 0
FROM public.organizations o JOIN public.units u ON u.organization_id = o.id AND u.name = 'Matriz SP'
WHERE o.name = 'Empresa Demo Ltda' ON CONFLICT (asset_tag) DO NOTHING;

INSERT INTO public.assets (asset_tag, type, model, status, organization_id, unit_id, user_id, version)
SELECT 'ASSET-DEMO-002', 'DESKTOP', 'HP EliteDesk 800 G6', 'AVAILABLE', o.id, u.id, NULL, 0
FROM public.organizations o JOIN public.units u ON u.organization_id = o.id AND u.name = 'Filial RJ'
WHERE o.name = 'Empresa Demo Ltda' ON CONFLICT (asset_tag) DO NOTHING;

INSERT INTO public.assets (asset_tag, type, model, status, organization_id, unit_id, user_id, version)
SELECT 'ASSET-DEMO-003', 'MOBILE_PHONE', 'Samsung Galaxy S23', 'ASSIGNED', o.id, u.id, usr.id, 0
FROM public.organizations o
JOIN public.units u ON u.organization_id = o.id AND u.name = 'Filial BH'
JOIN public.users usr ON usr.email = 'operador@empresa.com'
WHERE o.name = 'Empresa Demo Ltda' ON CONFLICT (asset_tag) DO NOTHING;

INSERT INTO public.assets (asset_tag, type, model, status, organization_id, unit_id, user_id, version)
SELECT 'ASSET-DEMO-004', 'NOTEBOOK', 'Lenovo ThinkPad X1 Carbon', 'IN_MAINTENANCE', o.id, u.id, NULL, 0
FROM public.organizations o JOIN public.units u ON u.organization_id = o.id AND u.name = 'Matriz SP'
WHERE o.name = 'Empresa Demo Ltda' ON CONFLICT (asset_tag) DO NOTHING;

INSERT INTO public.assets (asset_tag, type, model, status, organization_id, unit_id, user_id, version)
SELECT 'ASSET-DEMO-005', 'TABLET', 'iPad Pro 12.9"', 'AVAILABLE', o.id, u.id, NULL, 0
FROM public.organizations o JOIN public.units u ON u.organization_id = o.id AND u.name = 'Matriz SP'
WHERE o.name = 'Empresa Demo Ltda' ON CONFLICT (asset_tag) DO NOTHING;

-- 6. MANUTENÇÃO
INSERT INTO public.maintenance_records (asset_id, status, description, organization_id, unit_id, requested_by_user_id, version, created_at)
SELECT a.id, 'IN_PROGRESS',
    'Teclado com teclas travadas e bateria não carregando. Necessário troca de componentes.',
    o.id, u.id, usr.id, 0, NOW() - INTERVAL '3 days'
FROM public.assets a
JOIN public.organizations o ON o.name = 'Empresa Demo Ltda'
JOIN public.units u ON u.organization_id = o.id AND u.name = 'Matriz SP'
JOIN public.users usr ON usr.email = 'admin@empresa.com'
WHERE a.asset_tag = 'ASSET-DEMO-004';

-- 7. TRANSFERÊNCIA PENDENTE
INSERT INTO public.transfer_requests (asset_id, from_unit_id, to_unit_id, requested_by, status, reason, requested_at, version)
SELECT a.id, u_from.id, u_to.id, usr.id, 'PENDING',
    'Reforço de equipamentos para equipe de campo da Filial BH.',
    NOW() - INTERVAL '1 day', 0
FROM public.assets a
JOIN public.organizations o ON o.name = 'Empresa Demo Ltda'
JOIN public.units u_from ON u_from.organization_id = o.id AND u_from.name = 'Filial RJ'
JOIN public.units u_to ON u_to.organization_id = o.id AND u_to.name = 'Filial BH'
JOIN public.users usr ON usr.email = 'gestor@empresa.com'
WHERE a.asset_tag = 'ASSET-DEMO-002';

-- ============================================================
-- CREDENCIAIS
-- admin@empresa.com    | Admin@123  | ADMIN    | Matriz SP
-- gestor@empresa.com   | Gestor@123 | GESTOR   | Filial RJ
-- operador@empresa.com | Op@12345   | OPERADOR | Filial BH
-- ============================================================