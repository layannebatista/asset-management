
CREATE TABLE maintenance (
    id BIGSERIAL PRIMARY KEY,
    asset_id BIGINT NOT NULL,
    status VARCHAR(50),
    started_at TIMESTAMP,
    finished_at TIMESTAMP
);
