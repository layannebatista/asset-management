package com.portfolio.asset_management.domain.transfer;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Representa a decisão formal sobre uma solicitação de transferência.
 *
 * <p>Esta entidade é IMUTÁVEL. Uma vez criada, não pode ser alterada.
 */
@Entity
@Table(name = "transfer_approvals")
public class TransferApproval {

  @Id @GeneratedValue private UUID id;

  @Column(name = "transfer_request_id", nullable = false)
  private UUID transferRequestId;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 30)
  private TransferStatus decision;

  @Column(name = "approved_by", nullable = false)
  private UUID approvedBy;

  @Column(name = "approved_at", nullable = false, updatable = false)
  private LocalDateTime approvedAt;

  @Column(name = "reason", length = 255)
  private String reason;

  protected TransferApproval() {
    // JPA only
  }

  private TransferApproval(
      UUID transferRequestId, TransferStatus decision, UUID approvedBy, String reason) {
    this.transferRequestId = transferRequestId;
    this.decision = decision;
    this.approvedBy = approvedBy;
    this.reason = reason;
    this.approvedAt = LocalDateTime.now();
  }

  /* ======================================================
  FÁBRICAS (ÚNICA FORMA DE CRIAR)
  ====================================================== */

  public static TransferApproval approve(UUID transferRequestId, UUID approvedBy) {
    return new TransferApproval(transferRequestId, TransferStatus.APROVADA, approvedBy, null);
  }

  public static TransferApproval reject(UUID transferRequestId, UUID approvedBy, String reason) {
    return new TransferApproval(transferRequestId, TransferStatus.REJEITADA, approvedBy, reason);
  }

  /* ======================================================
  GETTERS (SOMENTE LEITURA)
  ====================================================== */

  public UUID getId() {
    return id;
  }

  public UUID getTransferRequestId() {
    return transferRequestId;
  }

  public TransferStatus getDecision() {
    return decision;
  }

  public UUID getApprovedBy() {
    return approvedBy;
  }

  public LocalDateTime getApprovedAt() {
    return approvedAt;
  }

  public String getReason() {
    return reason;
  }
}
