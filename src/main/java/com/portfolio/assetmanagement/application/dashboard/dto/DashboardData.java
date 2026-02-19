package com.portfolio.assetmanagement.application.dashboard.dto;

import java.util.List;

public class DashboardData {

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

  public Long getTotalAssets() {
    return totalAssets;
  }

  public void setTotalAssets(Long totalAssets) {
    this.totalAssets = totalAssets;
  }

  public List<Object[]> getAssetsByStatus() {
    return assetsByStatus;
  }

  public void setAssetsByStatus(List<Object[]> assetsByStatus) {
    this.assetsByStatus = assetsByStatus;
  }

  public List<Object[]> getAssetsByUnit() {
    return assetsByUnit;
  }

  public void setAssetsByUnit(List<Object[]> assetsByUnit) {
    this.assetsByUnit = assetsByUnit;
  }

  public List<Object[]> getAssetsByType() {
    return assetsByType;
  }

  public void setAssetsByType(List<Object[]> assetsByType) {
    this.assetsByType = assetsByType;
  }

  public Long getTotalMaintenance() {
    return totalMaintenance;
  }

  public void setTotalMaintenance(Long totalMaintenance) {
    this.totalMaintenance = totalMaintenance;
  }

  public List<Object[]> getMaintenanceByStatus() {
    return maintenanceByStatus;
  }

  public void setMaintenanceByStatus(List<Object[]> maintenanceByStatus) {
    this.maintenanceByStatus = maintenanceByStatus;
  }

  public List<Object[]> getMaintenanceByMonth() {
    return maintenanceByMonth;
  }

  public void setMaintenanceByMonth(List<Object[]> maintenanceByMonth) {
    this.maintenanceByMonth = maintenanceByMonth;
  }

  public List<Object[]> getTransferByStatus() {
    return transferByStatus;
  }

  public void setTransferByStatus(List<Object[]> transferByStatus) {
    this.transferByStatus = transferByStatus;
  }

  public List<Object[]> getTransferByMonth() {
    return transferByMonth;
  }

  public void setTransferByMonth(List<Object[]> transferByMonth) {
    this.transferByMonth = transferByMonth;
  }

  public Long getTotalUsers() {
    return totalUsers;
  }

  public void setTotalUsers(Long totalUsers) {
    this.totalUsers = totalUsers;
  }

  public List<Object[]> getUsersByStatus() {
    return usersByStatus;
  }

  public void setUsersByStatus(List<Object[]> usersByStatus) {
    this.usersByStatus = usersByStatus;
  }

  public List<Object[]> getUsersByRole() {
    return usersByRole;
  }

  public void setUsersByRole(List<Object[]> usersByRole) {
    this.usersByRole = usersByRole;
  }
}
