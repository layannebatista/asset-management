package com.portfolio.asset_management.domain.transfer;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Projeção de leitura da Transferência de um Ativo.
 *
 * Este modelo NÃO é Aggregate Root.
 * NÃO contém regra de negócio.
 * NÃO governa fluxo.
 *
 * Ele representa uma visão consolidada do processo
 * de transferência para fins de consulta, listagem e relatórios.
 */
@Entity
@Table(name = "transfers")
public class Transfer {

  @Id
  private UUID id;

  @Column(nullable = false)
  private UUID assetId;

  @Column(nullable = false)
  private UUID originUnitId;

  @Column(nullable = false)
  private UUID destinationUnitId;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private TransferRequestStatus requestStatus;

  @Column(nullable = false)
  private LocalDateTime createdAt;

  private LocalDateTime approvedAt;
  private LocalDateTime executedAt;
  private LocalDateTime cancelledAt;
  private LocalDateTime rejectedAt;

  protected Transfer() {
    // JPA
  }

  /**
   * Cria uma projeção de leitura a partir da TransferRequest.
   * Esse método deve ser usado por listeners / serviços de projeção.
   */
  public static Transfer from(TransferRequest request) {
    Transfer transfer = new Transfer();
    transfer.id = request.getId();
    transfer.assetId = request.getAssetId();
    transfer.originUnitId = request.getOriginUnitId();
    transfer.destinationUnitId = request.getDestinationUnitId();
    transfer.requestStatus = request.getStatus();
    transfer.createdAt = request.getCreatedAt();
    transfer.approvedAt = request.getApprovedAt();
    transfer.executedAt = request.getExecutedAt();
    transfer.cancelledAt = request.getCancelledAt();
    transfer.rejectedAt = request.getRejectedAt();
    return transfer;
  }

  /* ======================================================
     GETTERS (SOMENTE LEITURA)
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

  public TransferRequestStatus getRequestStatus() {
    return requestStatus;
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
}
