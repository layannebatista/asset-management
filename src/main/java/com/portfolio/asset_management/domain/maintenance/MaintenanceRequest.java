package com.portfolio.asset_management.domain.maintenance;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "maintenance_requests")
public class MaintenanceRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long assetId;

    private String description;

    private String status;

    private LocalDateTime openedAt;

    private LocalDateTime closedAt;

    private Long requestedBy;

    protected MaintenanceRequest() {
    }

    public MaintenanceRequest(Long assetId, String description, Long requestedBy) {
        this.assetId = assetId;
        this.description = description;
        this.requestedBy = requestedBy;
        this.status = "OPEN";
        this.openedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public Long getAssetId() {
        return assetId;
    }

    public String getDescription() {
        return description;
    }

    public String getStatus() {
        return status;
    }

    public LocalDateTime getOpenedAt() {
        return openedAt;
    }

    public LocalDateTime getClosedAt() {
        return closedAt;
    }

    public Long getRequestedBy() {
        return requestedBy;
    }

    public void close() {
        this.status = "CLOSED";
        this.closedAt = LocalDateTime.now();
    }
}
