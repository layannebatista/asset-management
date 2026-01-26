package com.portfolio.asset_management.domain.maintenance;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Representa um processo de manutenção de um ativo.
 *
 * <p>Essa entidade NÃO altera o ativo diretamente. Ela representa apenas o ciclo da manutenção.
 */
@Entity
@Table(name = "maintenances")
public class Maintenance {

  @Id @GeneratedValue private UUID id;

  @Column(name = "asset_id", nullable = false)
  private UUID assetId;

  @Column(name = "description", nullable = false, length = 255)
  private String description;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 30)
  private MaintenanceStatus status;

  @Column(name = "opened_by", nullable = false)
  private UUID openedBy;

  @Column(name = "opened_at", nullable = false, updatable = false)
  private LocalDateTime openedAt;

  @Column(name = "started_at")
  private LocalDateTime startedAt;

  @Column(name = "finished_at")
  private LocalDateTime finishedAt;

  @Column(name = "canceled_at")
  private LocalDateTime canceledAt;

  @Column(name = "canceled_reason", length = 255)
  private String canceledReason;

  protected Maintenance() {
    // JPA only
  }

  private Maintenance(UUID assetId, String description, UUID openedBy) {
    this.assetId = assetId;
    this.description = description;
    this.openedBy = openedBy;
    this.status = MaintenanceStatus.ABERTA;
    this.openedAt = LocalDateTime.now();
  }

  /* ======================================================
  FÁBRICA (CRIAÇÃO)
  ====================================================== */

  public static Maintenance open(UUID assetId, String description, UUID openedBy) {
    return new Maintenance(assetId, description, openedBy);
  }

  /* ======================================================
  TRANSIÇÕES DE ESTADO
  ====================================================== */

  public void start() {
    ensureStatus(MaintenanceStatus.ABERTA);
    this.status = MaintenanceStatus.EM_EXECUCAO;
    this.startedAt = LocalDateTime.now();
  }

  public void finish() {
    ensureStatus(MaintenanceStatus.EM_EXECUCAO);
    this.status = MaintenanceStatus.FINALIZADA;
    this.finishedAt = LocalDateTime.now();
  }

  public void cancel(String reason) {
    ensureStatus(MaintenanceStatus.ABERTA);
    this.status = MaintenanceStatus.CANCELADA;
    this.canceledReason = reason;
    this.canceledAt = LocalDateTime.now();
  }

  /* ======================================================
  REGRAS INTERNAS
  ====================================================== */

  private void ensureStatus(MaintenanceStatus expected) {
    if (this.status != expected) {
      throw new IllegalStateException(
          "Manutenção não pode mudar de estado. Estado atual: " + status);
    }
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

  public String getDescription() {
    return description;
  }

  public MaintenanceStatus getStatus() {
    return status;
  }

  public UUID getOpenedBy() {
    return openedBy;
  }

  public LocalDateTime getOpenedAt() {
    return openedAt;
  }

  public LocalDateTime getStartedAt() {
    return startedAt;
  }

  public LocalDateTime getFinishedAt() {
    return finishedAt;
  }

  public LocalDateTime getCanceledAt() {
    return canceledAt;
  }

  public String getCanceledReason() {
    return canceledReason;
  }
}
