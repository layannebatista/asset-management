package com.portfolio.assetmanagement.application.dashboard.dto;

public class AssetIdleItemDTO {
  private String assetTag;
  private String model;
  private String type;
  private long idleDays;

  public AssetIdleItemDTO() {}

  public AssetIdleItemDTO(String assetTag, String model, String type, long idleDays) {
    this.assetTag = assetTag;
    this.model = model;
    this.type = type;
    this.idleDays = idleDays;
  }

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

  public long getIdleDays() {
    return idleDays;
  }

  public void setIdleDays(long v) {
    this.idleDays = v;
  }
}
