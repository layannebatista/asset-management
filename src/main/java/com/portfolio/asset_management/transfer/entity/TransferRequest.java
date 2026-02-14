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

  /**
   * Controle de concorrência otimista.
   *
   * <p>Impede aprovações simultâneas, completes simultâneos e race conditions.
   */
  @Version
  @Column(nullable = false)
  private Long version;

  @ManyToOne(optional = false, fetch = FetchType.LAZY)
  @JoinColumn(name = "asset_id", nullable = false)
  private Asset asset;

  @ManyToOne(optional = false, fetch = FetchType.LAZY)
  @JoinColumn(name = "from_unit_id", nullable = false)
  private Unit fromUnit;

  @ManyToOne(optional = false, fetch = FetchType.LAZY)
  @JoinColumn(name = "to_unit_id", nullable = false)
  private Unit toUnit;

  @ManyToOne(optional = false, fetch = FetchType.LAZY)
  @JoinColumn(name = "requested_by", nullable = false)
  private User requestedBy;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "approved_by")
  private User approvedBy;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 30)
  private TransferStatus status;

  @Column(nullable = false, length = 500)
  private String reason;

  @Column(nullable = false)
  private LocalDateTime requestedAt;

  private LocalDateTime approvedAt;

  private LocalDateTime completedAt;

  protected TransferRequest() {}

  public TransferRequest(Asset asset, Unit fromUnit, Unit toUnit, User requestedBy, String reason) {

    validateConstructor(asset, fromUnit, toUnit, requestedBy, reason);

    this.asset = asset;
    this.fromUnit = fromUnit;
    this.toUnit = toUnit;
    this.requestedBy = requestedBy;
    this.reason = reason;

    this.status = TransferStatus.PENDING;
    this.requestedAt = LocalDateTime.now();
  }

  private void validateConstructor(
      Asset asset, Unit fromUnit, Unit toUnit, User requestedBy, String reason) {

    if (asset == null) {
      throw new IllegalArgumentException("asset é obrigatório");
    }

    if (fromUnit == null) {
      throw new IllegalArgumentException("fromUnit é obrigatório");
    }

    if (toUnit == null) {
      throw new IllegalArgumentException("toUnit é obrigatório");
    }

    if (requestedBy == null) {
      throw new IllegalArgumentException("requestedBy é obrigatório");
    }

    if (reason == null || reason.isBlank()) {
      throw new IllegalArgumentException("reason é obrigatório");
    }

    if (fromUnit.getId().equals(toUnit.getId())) {
      throw new IllegalArgumentException("Transferência para mesma unidade não é permitida");
    }
  }

  public Long getId() {
    return id;
  }

  /** Usado automaticamente pelo Hibernate para controle de concorrência. */
  public Long getVersion() {
    return version;
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

  public LocalDateTime getRequestedAt() {
    return requestedAt;
  }

  public LocalDateTime getApprovedAt() {
    return approvedAt;
  }

  public LocalDateTime getCompletedAt() {
    return completedAt;
  }

  public boolean isPending() {
    return status == TransferStatus.PENDING;
  }

  public boolean isApproved() {
    return status == TransferStatus.APPROVED;
  }

  public boolean isCompleted() {
    return status == TransferStatus.COMPLETED;
  }

  public boolean isRejected() {
    return status == TransferStatus.REJECTED;
  }

  public void approve(User approver) {

    if (status != TransferStatus.PENDING) {
      throw new IllegalStateException("Apenas transferências PENDING podem ser aprovadas");
    }

    if (approver == null) {
      throw new IllegalArgumentException("approver é obrigatório");
    }

    this.status = TransferStatus.APPROVED;
    this.approvedBy = approver;
    this.approvedAt = LocalDateTime.now();
  }

  public void reject(User approver) {

    if (status != TransferStatus.PENDING) {
      throw new IllegalStateException("Apenas transferências PENDING podem ser rejeitadas");
    }

    if (approver == null) {
      throw new IllegalArgumentException("approver é obrigatório");
    }

    this.status = TransferStatus.REJECTED;
    this.approvedBy = approver;
    this.approvedAt = LocalDateTime.now();
  }

  public void complete() {

    if (status != TransferStatus.APPROVED) {
      throw new IllegalStateException("Apenas transferências APPROVED podem ser concluídas");
    }

    this.status = TransferStatus.COMPLETED;
    this.completedAt = LocalDateTime.now();
  }
}
