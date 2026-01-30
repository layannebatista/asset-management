package com.portfolio.asset_management.domain.maintenance;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * PROJEÇÃO de leitura do processo de Manutenção.
 *
 * <p>Este modelo NÃO é Aggregate Root.
 * NÃO contém regras de negócio.
 * NÃO governa fluxo.
 *
 * <p>Ele representa uma visão consolidada da manutenção
 * para fins de consulta, listagem e relatórios.
 *
 * <p>O processo oficial de manutenção é representado por:
 * {@link MaintenanceRequest}
 */
@Entity
@Table(name = "maintenances")
public class Maintenance {

  @Id
  private UUID id;

  @Column(nullable = false)
  private UUID assetId;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private MaintenanceRequestStatus status;

  @Column(nullable = false)
  private LocalDateTime createdAt;

  private LocalDateTime startedAt;
  private LocalDateTime finishedAt;
  private LocalDateTime cancelledAt;

  protected Maintenance() {
    // JPA
  }

  /**
   * Constrói a projeção a partir do Aggregate Root.
   * Este método deve ser usado por serviços de projeção
   * ou listeners de eventos.
   */
  public static Maintenance from(MaintenanceRequest request) {
    Maintenance maintenance = new Maintenance();
    maintenance.id = request.getId();
    maintenance.assetId = request.getAssetId();
    maintenance.status = request.getStatus();
    maintenance.createdAt = request.getCreatedAt();
    maintenance.startedAt = request.getStartedAt();
    maintenance.finishedAt = request.getFinishedAt();
    maintenance.cancelledAt = request.getCancelledAt();
    return maintenance;
  }

  /* ======================================================
     GETTERS — SOMENTE LEITURA
     ====================================================== */

  public UUID getId() {
    return id;
  }

  public UUID getAssetId() {
    return assetId;
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
}
