package com.portfolio.asset_management.transfer.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class TransferCreateDTO {

  @NotNull private Long assetId;

  @NotNull private Long toUnitId;

  @NotBlank private String reason;

  public Long getAssetId() {
    return assetId;
  }

  public void setAssetId(Long assetId) {
    this.assetId = assetId;
  }

  public Long getToUnitId() {
    return toUnitId;
  }

  public void setToUnitId(Long toUnitId) {
    this.toUnitId = toUnitId;
  }

  public String getReason() {
    return reason;
  }

  public void setReason(String reason) {
    this.reason = reason;
  }
}
