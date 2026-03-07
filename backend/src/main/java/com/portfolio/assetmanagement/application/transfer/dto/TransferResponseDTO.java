package com.portfolio.assetmanagement.application.transfer.dto;

import com.portfolio.assetmanagement.domain.transfer.enums.TransferStatus;
import java.time.OffsetDateTime;

// D1: adicionados requestedAt, approvedAt e completedAt — existem na entidade mas estavam
// ausentes no DTO, impossibilitando que o client saiba quando cada evento ocorreu.
public class TransferResponseDTO {

  private Long id;
  private Long assetId;
  private Long fromUnitId;
  private Long toUnitId;
  private TransferStatus status;
  private String reason;
  private OffsetDateTime requestedAt; // D1
  private OffsetDateTime approvedAt; // D1
  private OffsetDateTime completedAt; // D1

  public TransferResponseDTO(
      Long id,
      Long assetId,
      Long fromUnitId,
      Long toUnitId,
      TransferStatus status,
      String reason,
      OffsetDateTime requestedAt, // D1
      OffsetDateTime approvedAt, // D1
      OffsetDateTime completedAt) { // D1

    this.id = id;
    this.assetId = assetId;
    this.fromUnitId = fromUnitId;
    this.toUnitId = toUnitId;
    this.status = status;
    this.reason = reason;
    this.requestedAt = requestedAt;
    this.approvedAt = approvedAt;
    this.completedAt = completedAt;
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

  public OffsetDateTime getRequestedAt() { // D1
    return requestedAt;
  }

  public OffsetDateTime getApprovedAt() { // D1
    return approvedAt;
  }

  public OffsetDateTime getCompletedAt() { // D1
    return completedAt;
  }
}
