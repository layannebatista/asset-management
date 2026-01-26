
CREATE TABLE security_audit (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(150),
    action VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
