package com.portfolio.assetmanagement.application.dashboard.dto;

public class PersonalDashboardDTO {

  private Long totalAssetsAssigned;
  private Long totalMaintenanceRelated;

  public Long getTotalAssetsAssigned() {
    return totalAssetsAssigned;
  }

  public void setTotalAssetsAssigned(Long totalAssetsAssigned) {
    this.totalAssetsAssigned = totalAssetsAssigned;
  }

  public Long getTotalMaintenanceRelated() {
    return totalMaintenanceRelated;
  }

  public void setTotalMaintenanceRelated(Long totalMaintenanceRelated) {
    this.totalMaintenanceRelated = totalMaintenanceRelated;
  }
}
