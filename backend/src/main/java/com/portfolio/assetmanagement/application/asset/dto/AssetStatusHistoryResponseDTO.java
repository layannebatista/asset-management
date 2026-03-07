package com.portfolio.assetmanagement.application.asset.dto;

import com.portfolio.assetmanagement.domain.asset.enums.AssetStatus;
import java.time.OffsetDateTime;

// M1: DTO criado para evitar exposição da entidade JPA na API
public class AssetStatusHistoryResponseDTO {

  private Long id;
  private Long assetId;
  private AssetStatus previousStatus;
  private AssetStatus newStatus;
  private OffsetDateTime changedAt;
  private Long changedByUserId;

  public AssetStatusHistoryResponseDTO() {}

  public AssetStatusHistoryResponseDTO(
      Long id,
      Long assetId,
      AssetStatus previousStatus,
      AssetStatus newStatus,
      OffsetDateTime changedAt,
      Long changedByUserId) {
    this.id = id;
    this.assetId = assetId;
    this.previousStatus = previousStatus;
    this.newStatus = newStatus;
    this.changedAt = changedAt;
    this.changedByUserId = changedByUserId;
  }

  public Long getId() {
    return id;
  }

  public Long getAssetId() {
    return assetId;
  }

  public AssetStatus getPreviousStatus() {
    return previousStatus;
  }

  public AssetStatus getNewStatus() {
    return newStatus;
  }

  public OffsetDateTime getChangedAt() {
    return changedAt;
  }

  public Long getChangedByUserId() {
    return changedByUserId;
  }
}
