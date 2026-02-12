package com.portfolio.asset_management.asset.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "asset_assignment_history")
public class AssetAssignmentHistory {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "asset_id", nullable = false)
  private Long assetId;

  @Column(name = "from_user_id")
  private Long fromUserId;

  @Column(name = "to_user_id")
  private Long toUserId;

  @Column(name = "changed_by_user_id", nullable = false)
  private Long changedByUserId;

  @Column(name = "changed_at", nullable = false)
  private OffsetDateTime changedAt;

  protected AssetAssignmentHistory() {}

  public AssetAssignmentHistory(
      Long assetId, Long fromUserId, Long toUserId, Long changedByUserId) {

    this.assetId = assetId;
    this.fromUserId = fromUserId;
    this.toUserId = toUserId;
    this.changedByUserId = changedByUserId;
    this.changedAt = OffsetDateTime.now();
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
