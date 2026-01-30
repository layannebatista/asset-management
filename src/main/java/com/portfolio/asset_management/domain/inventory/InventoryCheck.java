package com.portfolio.asset_management.domain.inventory;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "inventory_checks")
public class InventoryCheck {

  @Id @GeneratedValue private UUID id;

  @Column(nullable = false)
  private UUID inventoryCycleId;

  @Column(nullable = false)
  private UUID assetId;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private InventoryCheckResult result;

  @Column(nullable = false)
  private UUID checkedBy;

  @Column(nullable = false)
  private LocalDateTime checkedAt;

  protected InventoryCheck() {
    // JPA
  }

  private InventoryCheck(
      UUID inventoryCycleId, UUID assetId, InventoryCheckResult result, UUID checkedBy) {

    this.inventoryCycleId = inventoryCycleId;
    this.assetId = assetId;
    this.result = result;
    this.checkedBy = checkedBy;
    this.checkedAt = LocalDateTime.now();
  }

  /* ===================== FACTORY ===================== */

  public static InventoryCheck registrar(
      UUID inventoryCycleId, UUID assetId, InventoryCheckResult result, UUID checkedBy) {

    if (inventoryCycleId == null || assetId == null || result == null || checkedBy == null) {
      throw new IllegalArgumentException("Dados obrigatórios para registrar check");
    }

    return new InventoryCheck(inventoryCycleId, assetId, result, checkedBy);
  }

  /* ===================== GETTERS ===================== */

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
}
