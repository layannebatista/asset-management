-- =========================================
-- V3__create_asset_history_tables.sql
-- Histórico completo de ativos
-- =========================================

-- =========================================
-- STATUS HISTORY
-- =========================================

CREATE TABLE asset_status_history (
    id BIGSERIAL PRIMARY KEY,

    asset_id BIGINT NOT NULL,

    previous_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,

    changed_by_user_id BIGINT NOT NULL,

    changed_at TIMESTAMP NOT NULL,

    CONSTRAINT fk_status_history_asset
        FOREIGN KEY (asset_id)
        REFERENCES assets (id)
);

CREATE INDEX idx_asset_status_history_asset
ON asset_status_history(asset_id);

CREATE INDEX idx_asset_status_history_changed_at
ON asset_status_history(changed_at);


-- =========================================
-- ASSIGNMENT HISTORY
-- =========================================

CREATE TABLE asset_assignment_history (
    id BIGSERIAL PRIMARY KEY,

    asset_id BIGINT NOT NULL,

    previous_user_id BIGINT,
    new_user_id BIGINT,

    changed_by_user_id BIGINT NOT NULL,

    changed_at TIMESTAMP WITH TIME ZONE NOT NULL,

    CONSTRAINT fk_assignment_history_asset
        FOREIGN KEY (asset_id)
        REFERENCES assets (id)
);

CREATE INDEX idx_asset_assignment_history_asset
ON asset_assignment_history(asset_id);

CREATE INDEX idx_asset_assignment_history_changed_at
ON asset_assignment_history(changed_at);
