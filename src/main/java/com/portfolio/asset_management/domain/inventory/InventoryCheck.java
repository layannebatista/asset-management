package com.portfolio.asset_management.domain.inventory;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Representa a conferência de um ativo dentro de um ciclo de inventário.
 *
 * <p>Esta entidade é IMUTÁVEL.
 */
@Entity
@Table(
    name = "inventory_checks",
    uniqueConstraints = {
      @UniqueConstraint(
          name = "uk_inventory_cycle_asset",
          columnNames = {"inventory_cycle_id", "asset_id"})
    })
public class InventoryCheck {

  @Id @GeneratedValue private UUID id;

  @Column(name = "inventory_cycle_id", nullable = false)
  private UUID inventoryCycleId;

  @Column(name = "asset_id", nullable = false)
  private UUID assetId;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 30)
  private InventoryCheckResult result;

  @Column(name = "checked_by", nullable = false)
  private UUID checkedBy;

  @Column(name = "checked_at", nullable = false, updatable = false)
  private LocalDateTime checkedAt;

  @Column(name = "observation", length = 255)
  private String observation;

  protected InventoryCheck() {
    // JPA only
  }

  private InventoryCheck(
      UUID inventoryCycleId,
      UUID assetId,
      InventoryCheckResult result,
      UUID checkedBy,
      String observation) {
    this.inventoryCycleId = inventoryCycleId;
    this.assetId = assetId;
    this.result = result;
    this.checkedBy = checkedBy;
    this.observation = observation;
    this.checkedAt = LocalDateTime.now();
  }

  /* ======================================================
  FÁBRICA (CRIAÇÃO)
  ====================================================== */

  public static InventoryCheck create(
      UUID inventoryCycleId,
      UUID assetId,
      InventoryCheckResult result,
      UUID checkedBy,
      String observation) {
    return new InventoryCheck(inventoryCycleId, assetId, result, checkedBy, observation);
  }

  /* ======================================================
  GETTERS (SOMENTE LEITURA)
  ====================================================== */

  public UUID getId() {
    return id;
  }

  public UUID getInventoryCycleId() {
    return inventoryCycleId;
  }

  public UUID getAssetId() {
    return assetId;
  }

  public InventoryCheckResult getResult() {
    return result;
  }

  public UUID getCheckedBy() {
    return checkedBy;
  }

  public LocalDateTime getCheckedAt() {
    return checkedAt;
  }

  public String getObservation() {
    return observation;
  }
}
