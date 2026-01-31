-- =========================================
-- V1__initial_schema.sql
-- Criação do schema inicial do sistema
-- =========================================

-- =========================================
-- ORGANIZATIONS
-- =========================================
CREATE TABLE organizations (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL
);

-- =========================================
-- UNITS
-- =========================================
CREATE TABLE units (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    main_unit BOOLEAN NOT NULL,
    organization_id BIGINT NOT NULL,
    CONSTRAINT fk_unit_organization
        FOREIGN KEY (organization_id)
        REFERENCES organizations (id)
);

-- =========================================
-- USERS
-- =========================================
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    document_number VARCHAR(20) NOT NULL,
    lgpd_accepted BOOLEAN NOT NULL,
    organization_id BIGINT NOT NULL,
    unit_id BIGINT NOT NULL,
    CONSTRAINT fk_user_organization
        FOREIGN KEY (organization_id)
        REFERENCES organizations (id),
    CONSTRAINT fk_user_unit
        FOREIGN KEY (unit_id)
        REFERENCES units (id)
);

-- =========================================
-- ASSETS
-- =========================================
CREATE TABLE assets (
    id BIGSERIAL PRIMARY KEY,
    asset_tag VARCHAR(255) NOT NULL UNIQUE,
    type VARCHAR(50) NOT NULL,
    model VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    organization_id BIGINT NOT NULL,
    unit_id BIGINT NOT NULL,
    user_id BIGINT,
    CONSTRAINT fk_asset_organization
        FOREIGN KEY (organization_id)
        REFERENCES organizations (id),
    CONSTRAINT fk_asset_unit
        FOREIGN KEY (unit_id)
        REFERENCES units (id),
    CONSTRAINT fk_asset_user
        FOREIGN KEY (user_id)
        REFERENCES users (id)
);
