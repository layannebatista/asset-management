CREATE TABLE asset_lifecycle_events (
    id BIGSERIAL PRIMARY KEY,
    asset_id BIGINT NOT NULL,
    previous_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    reason TEXT,
    changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);