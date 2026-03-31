package com.portfolio.assetmanagement.application.dashboard.dto;

public class PersonalAssetDTO {
  private String assetTag;
  private String model;
  private String type;
  private String status;
  private String assignedSince;
  private String maintenanceCode;

  public PersonalAssetDTO() {}

  public String getAssetTag() {
    return assetTag;
  }

  public void setAssetTag(String v) {
    this.assetTag = v;
  }

  public String getModel() {
    return model;
  }

  public void setModel(String v) {
    this.model = v;
  }

  public String getType() {
    return type;
  }

  public void setType(String v) {
    this.type = v;
  }

  public String getStatus() {
    return status;
  }

  public void setStatus(String v) {
    this.status = v;
  }

  public String getAssignedSince() {
    return assignedSince;
  }

  public void setAssignedSince(String v) {
    this.assignedSince = v;
  }

  public String getMaintenanceCode() {
    return maintenanceCode;
  }

  public void setMaintenanceCode(String v) {
    this.maintenanceCode = v;
  }
}
