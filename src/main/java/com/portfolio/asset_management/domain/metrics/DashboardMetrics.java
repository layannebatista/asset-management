package com.portfolio.asset_management.domain.metrics;

public class DashboardMetrics {

    private long totalAssets;
    private long activeAssets;
    private long assetsInMaintenance;
    private long assetsInTransfer;
    private long slaBreaches;
    private double averageResolutionTimeHours;

    public DashboardMetrics(
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
}
