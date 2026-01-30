package com.portfolio.asset_management.domain.inventory;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "inventory_items")
public class InventoryItem {

  @Id @GeneratedValue private UUID id;

  @Column(nullable = false)
  private UUID assetId;

  @Enumerated(EnumType.STRING)
  private InventoryCheckResult result;

  private LocalDateTime checkedAt;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "inventory_cycle_id")
  private InventoryCycle inventoryCycle;

  protected InventoryItem() {
    // JPA
  }

  private InventoryItem(UUID assetId) {
    if (assetId == null) {
      throw new IllegalArgumentException("Asset é obrigatório");
    }
    this.assetId = assetId;
  }

  /* ===================== FACTORY ===================== */

  public static InventoryItem criar(UUID assetId) {
    return new InventoryItem(assetId);
  }

  /* ===================== COMPORTAMENTO ===================== */

  void associarAoCiclo(InventoryCycle cycle) {
    this.inventoryCycle = cycle;
  }

  public void registrarResultado(InventoryCheckResult result) {
    if (!inventoryCycle.isAberto()) {
      throw new IllegalStateException("Não é possível registrar resultado com inventário fechado");
    }

    if (this.result != null) {
      throw new IllegalStateException("Resultado já registrado para este ativo");
    }

    if (result == null) {
      throw new IllegalArgumentException("Resultado do inventário é obrigatório");
    }

    this.result = result;
    this.checkedAt = LocalDateTime.now();
  }

  /* ===================== APOIO ===================== */

  public boolean isVerificado() {
    return result != null;
  }

  public boolean isNaoLocalizado() {
    return result == InventoryCheckResult.NAO_LOCALIZADO;
  }

  /* ===================== GETTERS ===================== */

  public UUID getAssetId() {
    return assetId;
  }

  public InventoryCheckResult getResult() {
    return result;
  }
}
