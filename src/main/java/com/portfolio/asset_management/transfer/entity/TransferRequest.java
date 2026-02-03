package com.portfolio.asset_management.transfer.entity;

import com.portfolio.asset_management.asset.entity.Asset;
import com.portfolio.asset_management.transfer.enums.TransferStatus;
import com.portfolio.asset_management.unit.entity.Unit;
import com.portfolio.asset_management.user.entity.User;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "transfer_requests")
public class TransferRequest {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(optional = false)
  private Asset asset;

  @ManyToOne(optional = false)
  @JoinColumn(name = "from_unit_id")
  private Unit fromUnit;

  @ManyToOne(optional = false)
  @JoinColumn(name = "to_unit_id")
  private Unit toUnit;

  @ManyToOne(optional = false)
  @JoinColumn(name = "requested_by")
  private User requestedBy;

  @ManyToOne
  @JoinColumn(name = "approved_by")
  private User approvedBy;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private TransferStatus status;

  @Column(nullable = false, length = 500)
  private String reason;

  private LocalDateTime requestedAt;
  private LocalDateTime approvedAt;
  private LocalDateTime completedAt;

  protected TransferRequest() {}

  public TransferRequest(Asset asset, Unit fromUnit, Unit toUnit, User requestedBy, String reason) {

    this.asset = asset;
    this.fromUnit = fromUnit;
    this.toUnit = toUnit;
    this.requestedBy = requestedBy;
    this.reason = reason;

    this.status = TransferStatus.PENDING;
    this.requestedAt = LocalDateTime.now();
  }

  public Long getId() {
    return id;
  }

  public Asset getAsset() {
    return asset;
  }

  public Unit getFromUnit() {
    return fromUnit;
  }

  public Unit getToUnit() {
    return toUnit;
  }

  public User getRequestedBy() {
    return requestedBy;
  }

  public User getApprovedBy() {
    return approvedBy;
  }

  public TransferStatus getStatus() {
    return status;
  }

  public String getReason() {
    return reason;
  }

  public void approve(User approver) {
    this.status = TransferStatus.APPROVED;
    this.approvedBy = approver;
    this.approvedAt = LocalDateTime.now();
  }

  public void reject(User approver) {
    this.status = TransferStatus.REJECTED;
    this.approvedBy = approver;
    this.approvedAt = LocalDateTime.now();
  }

  public void complete() {
    this.status = TransferStatus.COMPLETED;
    this.completedAt = LocalDateTime.now();
  }
}
