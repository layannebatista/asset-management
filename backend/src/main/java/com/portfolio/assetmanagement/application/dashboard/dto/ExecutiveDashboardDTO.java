package com.portfolio.assetmanagement.application.dashboard.dto;

import java.util.Map;

public class ExecutiveDashboardDTO {

  /* =======================
  ===== CARDS ===========
  ======================= */

  private Long totalAssets;
  private Long totalMaintenance;
  private Long totalUsers;

  /* =======================
  ===== ASSETS ==========
  ======================= */

  private Map<String, Long> assetsByStatus;
  private Map<String, Long> assetsByUnit;
  private Map<String, Long> assetsByType;

  /* ==========================
  ===== MAINTENANCE ========
  ========================== */

  private Map<String, Long> maintenanceByStatus;
  private Map<String, Long> maintenanceByMonth;

  /* ==========================
  ===== TRANSFER ===========
  ========================== */

  private Map<String, Long> transferByStatus;
  private Map<String, Long> transferByMonth;

  /* ==========================
  ===== USERS ==============
  ========================== */

  private Map<String, Long> usersByStatus;
  private Map<String, Long> usersByRole;

  /* =======================
  ===== GETTERS =========
  ======================= */

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

  public Map<String, Long> getAssetsByUnit() {
    return assetsByUnit;
  }

  public void setAssetsByUnit(Map<String, Long> assetsByUnit) {
    this.assetsByUnit = assetsByUnit;
  }

  public Map<String, Long> getAssetsByType() {
    return assetsByType;
  }

  public void setAssetsByType(Map<String, Long> assetsByType) {
    this.assetsByType = assetsByType;
  }

  public Map<String, Long> getMaintenanceByStatus() {
    return maintenanceByStatus;
  }

  public void setMaintenanceByStatus(Map<String, Long> maintenanceByStatus) {
    this.maintenanceByStatus = maintenanceByStatus;
  }

  public Map<String, Long> getMaintenanceByMonth() {
    return maintenanceByMonth;
  }

  public void setMaintenanceByMonth(Map<String, Long> maintenanceByMonth) {
    this.maintenanceByMonth = maintenanceByMonth;
  }

  public Map<String, Long> getTransferByStatus() {
    return transferByStatus;
  }

  public void setTransferByStatus(Map<String, Long> transferByStatus) {
    this.transferByStatus = transferByStatus;
  }

  public Map<String, Long> getTransferByMonth() {
    return transferByMonth;
  }

  public void setTransferByMonth(Map<String, Long> transferByMonth) {
    this.transferByMonth = transferByMonth;
  }

  public Map<String, Long> getUsersByStatus() {
    return usersByStatus;
  }

  public void setUsersByStatus(Map<String, Long> usersByStatus) {
    this.usersByStatus = usersByStatus;
  }

  public Map<String, Long> getUsersByRole() {
    return usersByRole;
  }

  public void setUsersByRole(Map<String, Long> usersByRole) {
    this.usersByRole = usersByRole;
  }
}
