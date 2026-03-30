package com.portfolio.assetmanagement.application.dashboard.dto;

import java.math.BigDecimal;
import java.util.List;

public class DashboardData {

  // Básicos
  private Long totalAssets;
  private List<Object[]> assetsByStatus;
  private List<Object[]> assetsByUnit;
  private List<Object[]> assetsByType;

  private Long totalMaintenance;
  private List<Object[]> maintenanceByStatus;
  private List<Object[]> maintenanceByMonth;

  private List<Object[]> transferByStatus;
  private List<Object[]> transferByMonth;

  private Long totalUsers;
  private List<Object[]> usersByStatus;
  private List<Object[]> usersByRole;

  // Admin — novos
  private Long assetsAvailable;
  private Long assetsRetiredThisMonth;
  private Long assetsIdleCount;
  private Long pendingTransfersCount;
  private BigDecimal maintenanceCostMonth;
  private Long insuranceExpiringCount;

  // Unit (Gestor) — novos
  private Double utilizationRate;
  private List<AssetIdleItemDTO> assetsIdleList;

  // Personal (Operador) — novos
  private Long myPendingTransfers;
  private List<PersonalAssetDTO> myAssets;
  private List<PersonalMaintenanceDTO> myOpenMaintenances;

  // Getters e Setters básicos
  public Long getTotalAssets() { return totalAssets; }
  public void setTotalAssets(Long v) { this.totalAssets = v; }
  public List<Object[]> getAssetsByStatus() { return assetsByStatus; }
  public void setAssetsByStatus(List<Object[]> v) { this.assetsByStatus = v; }
  public List<Object[]> getAssetsByUnit() { return assetsByUnit; }
  public void setAssetsByUnit(List<Object[]> v) { this.assetsByUnit = v; }
  public List<Object[]> getAssetsByType() { return assetsByType; }
  public void setAssetsByType(List<Object[]> v) { this.assetsByType = v; }
  public Long getTotalMaintenance() { return totalMaintenance; }
  public void setTotalMaintenance(Long v) { this.totalMaintenance = v; }
  public List<Object[]> getMaintenanceByStatus() { return maintenanceByStatus; }
  public void setMaintenanceByStatus(List<Object[]> v) { this.maintenanceByStatus = v; }
  public List<Object[]> getMaintenanceByMonth() { return maintenanceByMonth; }
  public void setMaintenanceByMonth(List<Object[]> v) { this.maintenanceByMonth = v; }
  public List<Object[]> getTransferByStatus() { return transferByStatus; }
  public void setTransferByStatus(List<Object[]> v) { this.transferByStatus = v; }
  public List<Object[]> getTransferByMonth() { return transferByMonth; }
  public void setTransferByMonth(List<Object[]> v) { this.transferByMonth = v; }
  public Long getTotalUsers() { return totalUsers; }
  public void setTotalUsers(Long v) { this.totalUsers = v; }
  public List<Object[]> getUsersByStatus() { return usersByStatus; }
  public void setUsersByStatus(List<Object[]> v) { this.usersByStatus = v; }
  public List<Object[]> getUsersByRole() { return usersByRole; }
  public void setUsersByRole(List<Object[]> v) { this.usersByRole = v; }

  // Admin novos
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

  // Unit novos
  public Double getUtilizationRate() { return utilizationRate; }
  public void setUtilizationRate(Double v) { this.utilizationRate = v; }
  public List<AssetIdleItemDTO> getAssetsIdleList() { return assetsIdleList; }
  public void setAssetsIdleList(List<AssetIdleItemDTO> v) { this.assetsIdleList = v; }

  // Personal novos
  public Long getMyPendingTransfers() { return myPendingTransfers; }
  public void setMyPendingTransfers(Long v) { this.myPendingTransfers = v; }
  public List<PersonalAssetDTO> getMyAssets() { return myAssets; }
  public void setMyAssets(List<PersonalAssetDTO> v) { this.myAssets = v; }
  public List<PersonalMaintenanceDTO> getMyOpenMaintenances() { return myOpenMaintenances; }
  public void setMyOpenMaintenances(List<PersonalMaintenanceDTO> v) { this.myOpenMaintenances = v; }
}
