package com.portfolio.assetmanagement.application.dashboard.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public class UnitDashboardDTO {

  private Long totalAssets;
  private Long totalMaintenance;
  private Long totalUsers;
  private Map<String, Long> assetsByStatus;
  private Map<String, Long> maintenanceByStatus;

  // Novos campos operacionais
  private Long assetsAvailable;
  private Double utilizationRate;
  private Long pendingTransfersCount;
  private BigDecimal maintenanceCostMonth;
  private List<AssetIdleItemDTO> assetsIdleList;

  public Long getTotalAssets() { return totalAssets; }
  public void setTotalAssets(Long v) { this.totalAssets = v; }
  public Long getTotalMaintenance() { return totalMaintenance; }
  public void setTotalMaintenance(Long v) { this.totalMaintenance = v; }
  public Long getTotalUsers() { return totalUsers; }
  public void setTotalUsers(Long v) { this.totalUsers = v; }
  public Map<String, Long> getAssetsByStatus() { return assetsByStatus; }
  public void setAssetsByStatus(Map<String, Long> v) { this.assetsByStatus = v; }
  public Map<String, Long> getMaintenanceByStatus() { return maintenanceByStatus; }
  public void setMaintenanceByStatus(Map<String, Long> v) { this.maintenanceByStatus = v; }
  public Long getAssetsAvailable() { return assetsAvailable; }
  public void setAssetsAvailable(Long v) { this.assetsAvailable = v; }
  public Double getUtilizationRate() { return utilizationRate; }
  public void setUtilizationRate(Double v) { this.utilizationRate = v; }
  public Long getPendingTransfersCount() { return pendingTransfersCount; }
  public void setPendingTransfersCount(Long v) { this.pendingTransfersCount = v; }
  public BigDecimal getMaintenanceCostMonth() { return maintenanceCostMonth; }
  public void setMaintenanceCostMonth(BigDecimal v) { this.maintenanceCostMonth = v; }
  public List<AssetIdleItemDTO> getAssetsIdleList() { return assetsIdleList; }
  public void setAssetsIdleList(List<AssetIdleItemDTO> v) { this.assetsIdleList = v; }
}
