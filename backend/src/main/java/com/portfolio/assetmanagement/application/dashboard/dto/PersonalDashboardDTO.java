package com.portfolio.assetmanagement.application.dashboard.dto;

import java.util.List;

public class PersonalDashboardDTO {

  private Long totalAssetsAssigned;
  private Long totalMaintenanceRelated;

  // Novos campos operacionais
  private Long myPendingTransfers;
  private List<PersonalAssetDTO> myAssets;
  private List<PersonalMaintenanceDTO> myOpenMaintenances;

  public Long getTotalAssetsAssigned() {
    return totalAssetsAssigned;
  }

  public void setTotalAssetsAssigned(Long v) {
    this.totalAssetsAssigned = v;
  }

  public Long getTotalMaintenanceRelated() {
    return totalMaintenanceRelated;
  }

  public void setTotalMaintenanceRelated(Long v) {
    this.totalMaintenanceRelated = v;
  }

  public Long getMyPendingTransfers() {
    return myPendingTransfers;
  }

  public void setMyPendingTransfers(Long v) {
    this.myPendingTransfers = v;
  }

  public List<PersonalAssetDTO> getMyAssets() {
    return myAssets;
  }

  public void setMyAssets(List<PersonalAssetDTO> v) {
    this.myAssets = v;
  }

  public List<PersonalMaintenanceDTO> getMyOpenMaintenances() {
    return myOpenMaintenances;
  }

  public void setMyOpenMaintenances(List<PersonalMaintenanceDTO> v) {
    this.myOpenMaintenances = v;
  }
}
