package com.portfolio.asset_management.domain.maintenance;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.Objects;
import java.util.UUID;

/**
 * Aggregate Root do processo de Manutenção de Ativos.
 *
 * <p>Representa o workflow completo de manutenção,
 * desde a solicitação até a finalização ou cancelamento.
 *
 * <p>Este objeto governa o processo.
 * Nenhuma regra de fluxo deve existir fora dele.
 */
@Entity
@Table(name = "maintenance_requests")
public class MaintenanceRequest {

  @Id
  @GeneratedValue
  private UUID id;

  @Column(nullable = false)
  private UUID assetId;

  @Column(nullable = false)
  private UUID requestedBy;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private MaintenanceRequestStatus status;

  @Column(nullable = false)
  private LocalDateTime createdAt;

  private LocalDateTime startedAt;
  private LocalDateTime finishedAt;
  private LocalDateTime cancelledAt;

  private String cancellationReason;

  @Version
  private Long version;

  protected MaintenanceRequest() {
    // JPA
  }

  private MaintenanceRequest(UUID assetId, UUID requestedBy) {
    if (assetId == null) {
      throw new IllegalArgumentException("Asset é obrigatório para manutenção");
    }
    if (requestedBy == null) {
      throw new IllegalArgumentException("Solicitante é obrigatório");
    }

    this.assetId = assetId;
    this.requestedBy = requestedBy;
    this.status = MaintenanceRequestStatus.CRIADA;
    this.createdAt = LocalDateTime.now();
  }

  /* ======================================================
     FACTORY
     ====================================================== */

  public static MaintenanceRequest criar(UUID assetId, UUID requestedBy) {
    return new MaintenanceRequest(assetId, requestedBy);
  }

  /* ======================================================
     AÇÕES DE DOMÍNIO (REGRAS DE NEGÓCIO)
     ====================================================== */

  public void iniciarManutencao() {
    assertStatus(MaintenanceRequestStatus.CRIADA);

    this.status = MaintenanceRequestStatus.EM_MANUTENCAO;
    this.startedAt = LocalDateTime.now();
  }

  public void finalizarManutencao() {
    assertStatus(MaintenanceRequestStatus.EM_MANUTENCAO);

    this.status = MaintenanceRequestStatus.FINALIZADA;
    this.finishedAt = LocalDateTime.now();
  }

  public void cancelar(String reason) {
    if (isFinal()) {
      throw new IllegalStateException("Manutenção já encerrada não pode ser cancelada");
    }

    if (reason == null || reason.isBlank()) {
      throw new IllegalStateException("Motivo é obrigatório para cancelamento");
    }

    this.status = MaintenanceRequestStatus.CANCELADA;
    this.cancellationReason = reason;
    this.cancelledAt = LocalDateTime.now();
  }

  /* ======================================================
     REGRAS DE APOIO
     ====================================================== */

  public boolean isAtiva() {
    return status == MaintenanceRequestStatus.CRIADA
        || status == MaintenanceRequestStatus.EM_MANUTENCAO;
  }

  public boolean isFinal() {
    return status == MaintenanceRequestStatus.FINALIZADA
        || status == MaintenanceRequestStatus.CANCELADA;
  }

  private void assertStatus(MaintenanceRequestStatus expected) {
    if (this.status != expected) {
      throw new IllegalStateException(
          "Ação inválida para o status atual da manutenção: " + status);
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

  public UUID getRequestedBy() {
    return requestedBy;
  }

  public MaintenanceRequestStatus getStatus() {
    return status;
  }

  public LocalDateTime getCreatedAt() {
    return createdAt;
  }

  public LocalDateTime getStartedAt() {
    return startedAt;
  }

  public LocalDateTime getFinishedAt() {
    return finishedAt;
  }

  public LocalDateTime getCancelledAt() {
    return cancelledAt;
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
    if (!(o instanceof MaintenanceRequest)) return false;
    MaintenanceRequest that = (MaintenanceRequest) o;
    return Objects.equals(id, that.id);
  }

  @Override
  public int hashCode() {
    return Objects.hash(id);
  }
}
