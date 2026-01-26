package com.portfolio.asset_management.domain.metrics;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "metrics_snapshot")
public class MetricsSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private long totalAssets;
    private long activeAssets;
    private long assetsInMaintenance;
    private long assetsInTransfer;
    private long slaBreaches;

    private double averageResolutionTimeHours;

    private LocalDateTime capturedAt;

    protected MetricsSnapshot() {
    }

    public MetricsSnapshot(
            long totalAssets,
            long activeAssets,
            long assetsInMaintenance,
            long assetsInTransfer,
            long slaBreaches,
            double averageResolutionTimeHours
    ) {
        this.totalAssets = totalAssets;
        this.activeAssets = activeAssets;
        this.assetsInMaintenance = assetsInMaintenance;
        this.assetsInTransfer = assetsInTransfer;
        this.slaBreaches = slaBreaches;
        this.averageResolutionTimeHours = averageResolutionTimeHours;
        this.capturedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public long getTotalAssets() {
        return totalAssets;
    }

    public long getActiveAssets() {
        return activeAssets;
    }

    public long getAssetsInMaintenance() {
        return assetsInMaintenance;
    }

    public long getAssetsInTransfer() {
        return assetsInTransfer;
    }

    public long getSlaBreaches() {
        return slaBreaches;
    }

    public double getAverageResolutionTimeHours() {
        return averageResolutionTimeHours;
    }

    public LocalDateTime getCapturedAt() {
        return capturedAt;
    }
}
