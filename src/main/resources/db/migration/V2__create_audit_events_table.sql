-- =========================================
-- V2__create_audit_events_table.sql
-- Criação da tabela de auditoria
-- =========================================

CREATE TABLE audit_events (
    id BIGSERIAL PRIMARY KEY,

    type VARCHAR(100) NOT NULL,

    actor_user_id BIGINT,
    organization_id BIGINT NOT NULL,
    unit_id BIGINT,
    target_id BIGINT,

    details TEXT,

    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- =========================================
-- Índices para consultas futuras
-- =========================================

CREATE INDEX idx_audit_events_organization
    ON audit_events (organization_id);

CREATE INDEX idx_audit_events_unit
    ON audit_events (unit_id);

CREATE INDEX idx_audit_events_type
    ON audit_events (type);

CREATE INDEX idx_audit_events_created_at
    ON audit_events (created_at);
