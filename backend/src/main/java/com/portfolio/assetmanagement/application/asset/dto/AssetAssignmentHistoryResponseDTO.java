package com.portfolio.assetmanagement.application.asset.dto;

import java.time.OffsetDateTime;

// M1: DTO criado para evitar exposição da entidade JPA na API
public class AssetAssignmentHistoryResponseDTO {

  private Long id;
  private Long assetId;
  private Long fromUserId;
  private Long toUserId;
  private Long changedByUserId;
  private OffsetDateTime changedAt;

  public AssetAssignmentHistoryResponseDTO() {}

  public AssetAssignmentHistoryResponseDTO(
      Long id,
      Long assetId,
      Long fromUserId,
      Long toUserId,
      Long changedByUserId,
      OffsetDateTime changedAt) {
    this.id = id;
    this.assetId = assetId;
    this.fromUserId = fromUserId;
    this.toUserId = toUserId;
    this.changedByUserId = changedByUserId;
    this.changedAt = changedAt;
  }

  public Long getId() {
    return id;
  }

  public Long getAssetId() {
    return assetId;
  }

  public Long getFromUserId() {
    return fromUserId;
  }

  public Long getToUserId() {
    return toUserId;
  }

  public Long getChangedByUserId() {
    return changedByUserId;
  }

  public OffsetDateTime getChangedAt() {
    return changedAt;
  }
}
