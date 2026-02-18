package com.portfolio.assetmanagement.application.transfer.dto;

import com.portfolio.assetmanagement.domain.transfer.enums.TransferStatus;

public class TransferResponseDTO {

  private Long id;
  private Long assetId;
  private Long fromUnitId;
  private Long toUnitId;
  private TransferStatus status;
  private String reason;

  public TransferResponseDTO(
      Long id, Long assetId, Long fromUnitId, Long toUnitId, TransferStatus status, String reason) {

    this.id = id;
    this.assetId = assetId;
    this.fromUnitId = fromUnitId;
    this.toUnitId = toUnitId;
    this.status = status;
    this.reason = reason;
  }

  public Long getId() {
    return id;
  }

  public Long getAssetId() {
    return assetId;
  }

  public Long getFromUnitId() {
    return fromUnitId;
  }

  public Long getToUnitId() {
    return toUnitId;
  }

  public TransferStatus getStatus() {
    return status;
  }

  public String getReason() {
    return reason;
  }
}