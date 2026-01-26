package com.portfolio.asset_management.api.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public class MaintenanceDTO {

    private UUID maintenanceId;
    private UUID assetId;
    private String assetCode;
    private String description;
    private LocalDateTime startedAt;
    private LocalDateTime expectedEndAt;
    private LocalDateTime finishedAt;
    private boolean slaBreached;

    public MaintenanceDTO(
            UUID maintenanceId,
            UUID assetId,
            String assetCode,
            String description,
            LocalDateTime startedAt,
            LocalDateTime expectedEndAt,
            LocalDateTime finishedAt,
            boolean slaBreached
    ) {
        this.maintenanceId = maintenanceId;
        this.assetId = assetId;
        this.assetCode = assetCode;
        this.description = description;
        this.startedAt = startedAt;
        this.expectedEndAt = expectedEndAt;
        this.finishedAt = finishedAt;
        this.slaBreached = slaBreached;
    }

    public UUID getMaintenanceId() {
        return maintenanceId;
    }

    public UUID getAssetId() {
        return assetId;
    }

    public String getAssetCode() {
        return assetCode;
    }

    public String getDescription() {
        return description;
    }

    public LocalDateTime getStartedAt() {
        return startedAt;
    }

    public LocalDateTime getExpectedEndAt() {
        return expectedEndAt;
    }

    public LocalDateTime getFinishedAt() {
        return finishedAt;
    }

    public boolean isSlaBreached() {
        return slaBreached;
    }
}
