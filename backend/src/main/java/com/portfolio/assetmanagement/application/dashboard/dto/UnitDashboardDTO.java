package com.portfolio.assetmanagement.application.dashboard.dto;

import java.util.Map;

public class UnitDashboardDTO {

  private Long totalAssets;
  private Long totalMaintenance;
  private Long totalUsers;

  private Map<String, Long> assetsByStatus;
  private Map<String, Long> maintenanceByStatus;

  public Long getTotalAssets() {
    return totalAssets;
  }

  public void setTotalAssets(Long totalAssets) {
    this.totalAssets = totalAssets;
  }

  public Long getTotalMaintenance() {
    return totalMaintenance;
  }

  public void setTotalMaintenance(Long totalMaintenance) {
    this.totalMaintenance = totalMaintenance;
  }

  public Long getTotalUsers() {
    return totalUsers;
  }

  public void setTotalUsers(Long totalUsers) {
    this.totalUsers = totalUsers;
  }

  public Map<String, Long> getAssetsByStatus() {
    return assetsByStatus;
  }

  public void setAssetsByStatus(Map<String, Long> assetsByStatus) {
    this.assetsByStatus = assetsByStatus;
  }

  public Map<String, Long> getMaintenanceByStatus() {
    return maintenanceByStatus;
  }

  public void setMaintenanceByStatus(Map<String, Long> maintenanceByStatus) {
    this.maintenanceByStatus = maintenanceByStatus;
  }
}
