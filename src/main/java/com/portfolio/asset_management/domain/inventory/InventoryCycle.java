package com.portfolio.asset_management.domain.inventory;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

/** Representa um ciclo de inventário físico de ativos para uma unidade específica. */
@Entity
@Table(name = "inventory_cycles")
public class InventoryCycle {

  @Id @GeneratedValue private UUID id;

  @Column(name = "unit_id", nullable = false)
  private UUID unitId;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 30)
  private InventoryStatus status;

  @Column(name = "opened_by", nullable = false)
  private UUID openedBy;

  @Column(name = "opened_at", nullable = false, updatable = false)
  private LocalDateTime openedAt;

  @Column(name = "closed_at")
  private LocalDateTime closedAt;

  @Column(name = "canceled_at")
  private LocalDateTime canceledAt;

  @Column(name = "canceled_reason", length = 255)
  private String canceledReason;

  protected InventoryCycle() {
    // JPA only
  }

  private InventoryCycle(UUID unitId, UUID openedBy) {
    this.unitId = unitId;
    this.openedBy = openedBy;
    this.status = InventoryStatus.ABERTO;
    this.openedAt = LocalDateTime.now();
  }

  /* ======================================================
  FÁBRICA (CRIAÇÃO)
  ====================================================== */

  public static InventoryCycle open(UUID unitId, UUID openedBy) {
    return new InventoryCycle(unitId, openedBy);
  }

  /* ======================================================
  TRANSIÇÕES DE ESTADO
  ====================================================== */

  public void close() {
    ensureStatus(InventoryStatus.ABERTO);
    this.status = InventoryStatus.FECHADO;
    this.closedAt = LocalDateTime.now();
  }

  public void cancel(String reason) {
    ensureStatus(InventoryStatus.ABERTO);
    this.status = InventoryStatus.CANCELADO;
    this.canceledReason = reason;
    this.canceledAt = LocalDateTime.now();
  }

  /* ======================================================
  REGRAS INTERNAS
  ====================================================== */

  private void ensureStatus(InventoryStatus expected) {
    if (this.status != expected) {
      throw new IllegalStateException(
          "Ciclo de inventário não pode mudar de estado. Estado atual: " + status);
    }
  }

  /* ======================================================
  GETTERS (SOMENTE LEITURA)
  ====================================================== */

  public UUID getId() {
    return id;
  }

  public UUID getUnitId() {
    return unitId;
  }

  public InventoryStatus getStatus() {
    return status;
  }

  public UUID getOpenedBy() {
    return openedBy;
  }

  public LocalDateTime getOpenedAt() {
    return openedAt;
  }

  public LocalDateTime getClosedAt() {
    return closedAt;
  }

  public LocalDateTime getCanceledAt() {
    return canceledAt;
  }

  public String getCanceledReason() {
    return canceledReason;
  }
}
