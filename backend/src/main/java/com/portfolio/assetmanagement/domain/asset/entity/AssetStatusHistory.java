package com.portfolio.assetmanagement.domain.asset.entity;

import com.portfolio.assetmanagement.domain.asset.enums.AssetStatus;
import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "asset_status_history")
public class AssetStatusHistory {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false)
  private Long assetId;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private AssetStatus previousStatus;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private AssetStatus newStatus;

  @Column(nullable = false)
  private OffsetDateTime changedAt;

  @Column(nullable = false)
  private Long changedByUserId;

  protected AssetStatusHistory() {}

  public AssetStatusHistory(
      Long assetId, AssetStatus previousStatus, AssetStatus newStatus, Long changedByUserId) {

    this.assetId = assetId;
    this.previousStatus = previousStatus;
    this.newStatus = newStatus;
    this.changedByUserId = changedByUserId;
    this.changedAt = OffsetDateTime.now();
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
