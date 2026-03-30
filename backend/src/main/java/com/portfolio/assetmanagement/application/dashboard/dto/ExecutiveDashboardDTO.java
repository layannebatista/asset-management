package com.portfolio.assetmanagement.application.dashboard.dto;

import java.math.BigDecimal;
import java.util.Map;

public class ExecutiveDashboardDTO {

  // Cards básicos
  private Long totalAssets;
  private Long totalMaintenance;
  private Long totalUsers;

  // Distribuição
  private Map<String, Long> assetsByStatus;
  private Map<String, Long> assetsByUnit;
  private Map<String, Long> assetsByType;
  private Map<String, Long> maintenanceByStatus;
  private Map<String, Long> maintenanceByMonth;
  private Map<String, Long> transferByStatus;
  private Map<String, Long> transferByMonth;
  private Map<String, Long> usersByStatus;
  private Map<String, Long> usersByRole;

  // Novos campos operacionais
  private Long assetsAvailable;
  private Long assetsRetiredThisMonth;
  private Long assetsIdleCount;
  private Long pendingTransfersCount;
  private BigDecimal maintenanceCostMonth;
  private Long insuranceExpiringCount;

  public Long getTotalAssets() { return totalAssets; }
  public void setTotalAssets(Long v) { this.totalAssets = v; }
  public Long getTotalMaintenance() { return totalMaintenance; }
  public void setTotalMaintenance(Long v) { this.totalMaintenance = v; }
  public Long getTotalUsers() { return totalUsers; }
  public void setTotalUsers(Long v) { this.totalUsers = v; }
  public Map<String, Long> getAssetsByStatus() { return assetsByStatus; }
  public void setAssetsByStatus(Map<String, Long> v) { this.assetsByStatus = v; }
  public Map<String, Long> getAssetsByUnit() { return assetsByUnit; }
  public void setAssetsByUnit(Map<String, Long> v) { this.assetsByUnit = v; }
  public Map<String, Long> getAssetsByType() { return assetsByType; }
  public void setAssetsByType(Map<String, Long> v) { this.assetsByType = v; }
  public Map<String, Long> getMaintenanceByStatus() { return maintenanceByStatus; }
  public void setMaintenanceByStatus(Map<String, Long> v) { this.maintenanceByStatus = v; }
  public Map<String, Long> getMaintenanceByMonth() { return maintenanceByMonth; }
  public void setMaintenanceByMonth(Map<String, Long> v) { this.maintenanceByMonth = v; }
  public Map<String, Long> getTransferByStatus() { return transferByStatus; }
  public void setTransferByStatus(Map<String, Long> v) { this.transferByStatus = v; }
  public Map<String, Long> getTransferByMonth() { return transferByMonth; }
  public void setTransferByMonth(Map<String, Long> v) { this.transferByMonth = v; }
  public Map<String, Long> getUsersByStatus() { return usersByStatus; }
  public void setUsersByStatus(Map<String, Long> v) { this.usersByStatus = v; }
  public Map<String, Long> getUsersByRole() { return usersByRole; }
  public void setUsersByRole(Map<String, Long> v) { this.usersByRole = v; }
  public Long getAssetsAvailable() { return assetsAvailable; }
  public void setAssetsAvailable(Long v) { this.assetsAvailable = v; }
  public Long getAssetsRetiredThisMonth() { return assetsRetiredThisMonth; }
  public void setAssetsRetiredThisMonth(Long v) { this.assetsRetiredThisMonth = v; }
  public Long getAssetsIdleCount() { return assetsIdleCount; }
  public void setAssetsIdleCount(Long v) { this.assetsIdleCount = v; }
  public Long getPendingTransfersCount() { return pendingTransfersCount; }
  public void setPendingTransfersCount(Long v) { this.pendingTransfersCount = v; }
  public BigDecimal getMaintenanceCostMonth() { return maintenanceCostMonth; }
  public void setMaintenanceCostMonth(BigDecimal v) { this.maintenanceCostMonth = v; }
  public Long getInsuranceExpiringCount() { return insuranceExpiringCount; }
  public void setInsuranceExpiringCount(Long v) { this.insuranceExpiringCount = v; }
}
