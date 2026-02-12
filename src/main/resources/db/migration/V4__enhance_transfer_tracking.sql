-- =========================================
-- Transfer tracking enhancement
-- =========================================

ALTER TABLE transfer_requests
ADD COLUMN completed_by BIGINT;

ALTER TABLE transfer_requests
ADD COLUMN comment TEXT;

ALTER TABLE transfer_requests
ADD COLUMN rejected_at TIMESTAMP;

CREATE INDEX idx_transfer_requests_asset
ON transfer_requests(asset_id);

CREATE INDEX idx_transfer_requests_status
ON transfer_requests(status);
