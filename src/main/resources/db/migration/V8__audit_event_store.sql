
CREATE TABLE audit_event (
    id BIGSERIAL PRIMARY KEY,
    event_id VARCHAR(100),
    correlation_id VARCHAR(100),
    event_type VARCHAR(50),
    source VARCHAR(50),
    payload_before JSONB,
    payload_after JSONB,
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
