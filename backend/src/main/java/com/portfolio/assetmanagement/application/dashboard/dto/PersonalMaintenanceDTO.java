package com.portfolio.assetmanagement.application.dashboard.dto;

public class PersonalMaintenanceDTO {
  private String code;
  private String assetTag;
  private String status;
  private String createdAt;

  public PersonalMaintenanceDTO() {}

  public String getCode() {
    return code;
  }

  public void setCode(String v) {
    this.code = v;
  }

  public String getAssetTag() {
    return assetTag;
  }

  public void setAssetTag(String v) {
    this.assetTag = v;
  }

  public String getStatus() {
    return status;
  }

  public void setStatus(String v) {
    this.status = v;
  }

  public String getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(String v) {
    this.createdAt = v;
  }
}
