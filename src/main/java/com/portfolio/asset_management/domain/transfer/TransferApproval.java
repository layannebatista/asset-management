package com.portfolio.asset_management.domain.transfer;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.Objects;
import java.util.UUID;

/**
 * Entidade de governança que representa a decisão formal de aprovação ou rejeição de uma
 * TransferRequest.
 *
 * <p>TransferApproval NÃO governa o processo. Ela registra uma decisão imutável, auditável e
 * rastreável.
 *
 * <p>Sempre pertence a uma TransferRequest.
 */
@Entity
@Table(name = "transfer_approvals")
public class TransferApproval {

  @Id @GeneratedValue private UUID id;

  @Column(nullable = false)
  private UUID transferRequestId;

  @Column(nullable = false)
  private UUID decidedBy;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private TransferApprovalDecision decision;

  @Column(nullable = false)
  private LocalDateTime decidedAt;

  @Column(length = 500)
  private String comment;

  protected TransferApproval() {
    // JPA
  }

  private TransferApproval(
      UUID transferRequestId, UUID decidedBy, TransferApprovalDecision decision, String comment) {

    if (transferRequestId == null) {
      throw new IllegalArgumentException("TransferRequest é obrigatória para aprovação");
    }
    if (decidedBy == null) {
      throw new IllegalArgumentException("Aprovador é obrigatório");
    }
    if (decision == null) {
      throw new IllegalArgumentException("Decisão é obrigatória");
    }
    if (decision == TransferApprovalDecision.REJEITADA && (comment == null || comment.isBlank())) {
      throw new IllegalStateException("Comentário é obrigatório para rejeição");
    }

    this.transferRequestId = transferRequestId;
    this.decidedBy = decidedBy;
    this.decision = decision;
    this.comment = comment;
    this.decidedAt = LocalDateTime.now();
  }

  /* ======================================================
  FACTORIES
  ====================================================== */

  public static TransferApproval aprovar(UUID transferRequestId, UUID decidedBy, String comment) {

    return new TransferApproval(
        transferRequestId, decidedBy, TransferApprovalDecision.APROVADA, comment);
  }

  public static TransferApproval rejeitar(UUID transferRequestId, UUID decidedBy, String comment) {

    return new TransferApproval(
        transferRequestId, decidedBy, TransferApprovalDecision.REJEITADA, comment);
  }

  /* ======================================================
  GETTERS (IMUTÁVEL)
  ====================================================== */

  public UUID getId() {
    return id;
  }

  public UUID getTransferRequestId() {
    return transferRequestId;
  }

  public UUID getDecidedBy() {
    return decidedBy;
  }

  public TransferApprovalDecision getDecision() {
    return decision;
  }

  public LocalDateTime getDecidedAt() {
    return decidedAt;
  }

  public String getComment() {
    return comment;
  }

  /* ======================================================
  EQUALS & HASHCODE
  ====================================================== */

  @Override
  public boolean equals(Object o) {
    if (this == o) return true;
    if (!(o instanceof TransferApproval)) return false;
    TransferApproval that = (TransferApproval) o;
    return Objects.equals(id, that.id);
  }

  @Override
  public int hashCode() {
    return Objects.hash(id);
  }
}
