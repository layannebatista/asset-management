package com.portfolio.asset_management.domain.transfer;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.Objects;
import java.util.UUID;

/**
 * Aggregate Root do processo de Transferência de Ativos.
 *
 * Representa o workflow completo de uma transferência,
 * desde a criação até a execução final, com governança,
 * aprovação e auditoria.
 *
 * Este objeto é a FONTE DA VERDADE do processo.
 * Nenhuma regra de fluxo deve existir fora dele.
 */
@Entity
@Table(name = "transfer_requests")
public class TransferRequest {

  @Id
  @GeneratedValue
  private UUID id;

  @Column(nullable = false)
  private UUID assetId;

  @Column(nullable = false)
  private UUID originUnitId;

  @Column(nullable = false)
  private UUID destinationUnitId;

  @Column(nullable = false)
  private UUID requestedBy;

  @Column(nullable = false)
  @Enumerated(EnumType.STRING)
  private TransferRequestStatus status;

  @Column(nullable = false)
  private LocalDateTime createdAt;

  private LocalDateTime approvedAt;
  private LocalDateTime executedAt;
  private LocalDateTime cancelledAt;
  private LocalDateTime rejectedAt;

  private String rejectionReason;
  private String cancellationReason;

  @Version
  private Long version;

  protected TransferRequest() {
    // JPA
  }

  private TransferRequest(
      UUID assetId,
      UUID originUnitId,
      UUID destinationUnitId,
      UUID requestedBy) {

    if (assetId == null) {
      throw new IllegalArgumentException("Asset é obrigatório para transferência");
    }
    if (originUnitId == null || destinationUnitId == null) {
      throw new IllegalArgumentException("Unidade de origem e destino são obrigatórias");
    }
    if (originUnitId.equals(destinationUnitId)) {
      throw new IllegalStateException("Unidade de origem e destino não podem ser iguais");
    }
    if (requestedBy == null) {
      throw new IllegalArgumentException("Solicitante é obrigatório");
    }

    this.assetId = assetId;
    this.originUnitId = originUnitId;
    this.destinationUnitId = destinationUnitId;
    this.requestedBy = requestedBy;
    this.status = TransferRequestStatus.CRIADA;
    this.createdAt = LocalDateTime.now();
  }

  /* ======================================================
     FACTORY
     ====================================================== */

  public static TransferRequest criar(
      UUID assetId,
      UUID originUnitId,
      UUID destinationUnitId,
      UUID requestedBy) {

    return new TransferRequest(
        assetId,
        originUnitId,
        destinationUnitId,
        requestedBy);
  }

  /* ======================================================
     AÇÕES DE DOMÍNIO (REGRAS DE NEGÓCIO)
     ====================================================== */

  public void solicitarAprovacao() {
    assertStatus(TransferRequestStatus.CRIADA);

    this.status = TransferRequestStatus.EM_APROVACAO;
  }

  public void aprovar() {
    assertStatus(TransferRequestStatus.EM_APROVACAO);

    this.status = TransferRequestStatus.APROVADA;
    this.approvedAt = LocalDateTime.now();
  }

  public void rejeitar(String reason) {
    assertStatus(TransferRequestStatus.EM_APROVACAO);

    if (reason == null || reason.isBlank()) {
      throw new IllegalStateException("Motivo é obrigatório para rejeição");
    }

    this.status = TransferRequestStatus.REJEITADA;
    this.rejectionReason = reason;
    this.rejectedAt = LocalDateTime.now();
  }

  public void executar() {
    assertStatus(TransferRequestStatus.APROVADA);

    this.status = TransferRequestStatus.EXECUTADA;
    this.executedAt = LocalDateTime.now();
  }

  public void cancelar(String reason) {
    if (isFinal()) {
      throw new IllegalStateException("Transferência já encerrada não pode ser cancelada");
    }

    if (reason == null || reason.isBlank()) {
      throw new IllegalStateException("Motivo é obrigatório para cancelamento");
    }

    this.status = TransferRequestStatus.CANCELADA;
    this.cancellationReason = reason;
    this.cancelledAt = LocalDateTime.now();
  }

  /* ======================================================
     REGRAS DE APOIO
     ====================================================== */

  public boolean isAtiva() {
    return status == TransferRequestStatus.CRIADA
        || status == TransferRequestStatus.EM_APROVACAO
        || status == TransferRequestStatus.APROVADA;
  }

  public boolean isFinal() {
    return status == TransferRequestStatus.REJEITADA
        || status == TransferRequestStatus.EXECUTADA
        || status == TransferRequestStatus.CANCELADA;
  }

  private void assertStatus(TransferRequestStatus expected) {
    if (this.status != expected) {
      throw new IllegalStateException(
          "Ação inválida para o status atual da transferência: " + status);
    }
  }

  /* ======================================================
     GETTERS
     ====================================================== */

  public UUID getId() {
    return id;
  }

  public UUID getAssetId() {
    return assetId;
  }

  public UUID getOriginUnitId() {
    return originUnitId;
  }

  public UUID getDestinationUnitId() {
    return destinationUnitId;
  }

  public UUID getRequestedBy() {
    return requestedBy;
  }

  public TransferRequestStatus getStatus() {
    return status;
  }

  public LocalDateTime getCreatedAt() {
    return createdAt;
  }

  public LocalDateTime getApprovedAt() {
    return approvedAt;
  }

  public LocalDateTime getExecutedAt() {
    return executedAt;
  }

  public LocalDateTime getCancelledAt() {
    return cancelledAt;
  }

  public LocalDateTime getRejectedAt() {
    return rejectedAt;
  }

  public String getRejectionReason() {
    return rejectionReason;
  }

  public String getCancellationReason() {
    return cancellationReason;
  }

  /* ======================================================
     EQUALS & HASHCODE
     ====================================================== */

  @Override
  public boolean equals(Object o) {
    if (this == o) return true;
    if (!(o instanceof TransferRequest)) return false;
    TransferRequest that = (TransferRequest) o;
    return Objects.equals(id, that.id);
  }

  @Override
  public int hashCode() {
    return Objects.hash(id);
  }
}
