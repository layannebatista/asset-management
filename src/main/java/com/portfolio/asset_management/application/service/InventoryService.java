package com.portfolio.asset_management.application.service;

import com.portfolio.asset_management.domain.asset.Asset;
import com.portfolio.asset_management.domain.asset.AssetLifecycleEvent;
import com.portfolio.asset_management.domain.asset.AssetStatus;
import com.portfolio.asset_management.domain.inventory.*;
import com.portfolio.asset_management.infrastructure.persistence.*;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InventoryService {

  private final AssetRepository assetRepository;
  private final InventoryCycleRepository inventoryCycleRepository;
  private final InventoryCheckRepository inventoryCheckRepository;
  private final AssetLifecycleRepository assetLifecycleRepository;

  public InventoryService(
      AssetRepository assetRepository,
      InventoryCycleRepository inventoryCycleRepository,
      InventoryCheckRepository inventoryCheckRepository,
      AssetLifecycleRepository assetLifecycleRepository) {
    this.assetRepository = assetRepository;
    this.inventoryCycleRepository = inventoryCycleRepository;
    this.inventoryCheckRepository = inventoryCheckRepository;
    this.assetLifecycleRepository = assetLifecycleRepository;
  }

  /* ======================================================
  ABRIR CICLO DE INVENTÁRIO
  ====================================================== */

  @Transactional
  public InventoryCycle openInventory(UUID unitId, UUID openedBy) {

    boolean hasOpenCycle =
        inventoryCycleRepository.existsByUnitIdAndStatus(unitId, InventoryStatus.ABERTO);

    if (hasOpenCycle) {
      throw new IllegalStateException("Já existe um inventário aberto para esta unidade");
    }

    InventoryCycle cycle = InventoryCycle.open(unitId, openedBy);
    return inventoryCycleRepository.save(cycle);
  }

  /* ======================================================
  REGISTRAR CONFERÊNCIA DE ATIVO
  ====================================================== */

  @Transactional
  public InventoryCheck checkAsset(
      UUID inventoryCycleId,
      UUID assetId,
      InventoryCheckResult result,
      UUID checkedBy,
      String observation) {
    InventoryCycle cycle =
        inventoryCycleRepository
            .findById(inventoryCycleId)
            .orElseThrow(() -> new IllegalStateException("Ciclo de inventário não encontrado"));

    if (cycle.getStatus() != InventoryStatus.ABERTO) {
      throw new IllegalStateException("Inventário não está aberto");
    }

    boolean alreadyChecked =
        inventoryCheckRepository.existsByInventoryCycleIdAndAssetId(inventoryCycleId, assetId);

    if (alreadyChecked) {
      throw new IllegalStateException("Ativo já foi conferido neste inventário");
    }

    InventoryCheck check =
        InventoryCheck.create(inventoryCycleId, assetId, result, checkedBy, observation);

    inventoryCheckRepository.save(check);

    if (result == InventoryCheckResult.NAO_LOCALIZADO) {
      markAssetAsNotLocated(assetId, checkedBy);
    }

    return check;
  }

  /* ======================================================
  FECHAR CICLO DE INVENTÁRIO
  ====================================================== */

  @Transactional
  public void closeInventory(UUID inventoryCycleId, UUID closedBy) {

    InventoryCycle cycle =
        inventoryCycleRepository
            .findById(inventoryCycleId)
            .orElseThrow(() -> new IllegalStateException("Ciclo de inventário não encontrado"));

    cycle.close();
    inventoryCycleRepository.save(cycle);
  }

  /* ======================================================
  REGRAS INTERNAS
  ====================================================== */

  private void markAssetAsNotLocated(UUID assetId, UUID triggeredBy) {

    Asset asset =
        assetRepository
            .findById(assetId)
            .orElseThrow(() -> new IllegalStateException("Ativo não encontrado"));

    if (asset.getStatus() != AssetStatus.EM_USO) {
      return; // não altera ativos em manutenção, transferência etc.
    }

    AssetStatus previousStatus = asset.getStatus();

    asset.markAsNotLocated();
    assetRepository.save(asset);

    AssetLifecycleEvent event =
        AssetLifecycleEvent.ofStatusChange(
            asset.getId(),
            previousStatus,
            AssetStatus.NAO_LOCALIZADO,
            "INVENTORY_NOT_FOUND",
            triggeredBy,
            null);

    assetLifecycleRepository.save(event);
  }
}
