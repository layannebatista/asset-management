package com.portfolio.asset_management.api.dto;

import java.time.LocalDateTime;

public class KpiSummaryDTO {

  private long totalAssets;
  private long activeAssets;
  private long inactiveAssets;
  private long assetsUnderMaintenance;
  private long overdueMaintenances;
  private double slaCompliancePercentage;
  private LocalDateTime generatedAt;

  public KpiSummaryDTO(
      long totalAssets,
      long activeAssets,
      long inactiveAssets,
      long assetsUnderMaintenance,
      long overdueMaintenances,
      double slaCompliancePercentage) {
    this.totalAssets = totalAssets;
    this.activeAssets = activeAssets;
    this.inactiveAssets = inactiveAssets;
    this.assetsUnderMaintenance = assetsUnderMaintenance;
    this.overdueMaintenances = overdueMaintenances;
    this.slaCompliancePercentage = slaCompliancePercentage;
    this.generatedAt = LocalDateTime.now();
  }

  public long getTotalAssets() {
    return totalAssets;
  }

  public long getActiveAssets() {
    return activeAssets;
  }

  public long getInactiveAssets() {
    return inactiveAssets;
  }

  public long getAssetsUnderMaintenance() {
    return assetsUnderMaintenance;
  }

  public long getOverdueMaintenances() {
    return overdueMaintenances;
  }

  public double getSlaCompliancePercentage() {
    return slaCompliancePercentage;
  }

  public LocalDateTime getGeneratedAt() {
    return generatedAt;
  }
}
