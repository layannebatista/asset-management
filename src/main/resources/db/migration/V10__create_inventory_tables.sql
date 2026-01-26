
CREATE TABLE inventory_cycles (
    id BIGSERIAL PRIMARY KEY,
    branch_id BIGINT NOT NULL,
    opened_at TIMESTAMP NOT NULL,
    closed_at TIMESTAMP,
    status VARCHAR(30) NOT NULL
);

CREATE TABLE inventory_items (
    id BIGSERIAL PRIMARY KEY,
    asset_id BIGINT NOT NULL,
    cycle_id BIGINT NOT NULL,
    checked BOOLEAN DEFAULT FALSE
);
