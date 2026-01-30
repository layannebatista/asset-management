package com.portfolio.asset_management.application.service;

import com.portfolio.asset_management.domain.asset.Asset;
import com.portfolio.asset_management.domain.asset.AssetAction;
import com.portfolio.asset_management.domain.asset.AssetLifecycleEvent;
import com.portfolio.asset_management.domain.asset.AssetStatus;
import com.portfolio.asset_management.domain.inventory.InventoryCheck;
import com.portfolio.asset_management.domain.inventory.InventoryCheckResult;
import com.portfolio.asset_management.domain.inventory.InventoryCycle;
import com.portfolio.asset_management.domain.inventory.InventoryItem;
import com.portfolio.asset_management.infrastructure.persistence.AssetLifecycleRepository;
import com.portfolio.asset_management.infrastructure.persistence.AssetRepository;
import com.portfolio.asset_management.infrastructure.persistence.InventoryCheckRepository;
import com.portfolio.asset_management.infrastructure.persistence.InventoryCycleRepository;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Serviço de aplicação do módulo Inventory.
 *
 * <p>Responsável apenas por ORQUESTRAR: - InventoryCycle - InventoryItem - InventoryCheck - Asset
 *
 * <p>Este service NÃO contém regra de negócio. Todas as validações de fluxo devem existir no
 * domínio.
 */
@Service
public class InventoryService {

  private final InventoryCycleRepository inventoryCycleRepository;
  private final InventoryCheckRepository inventoryCheckRepository;
  private final AssetRepository assetRepository;
  private final AssetLifecycleRepository assetLifecycleRepository;

  public InventoryService(
      InventoryCycleRepository inventoryCycleRepository,
      InventoryCheckRepository inventoryCheckRepository,
      AssetRepository assetRepository,
      AssetLifecycleRepository assetLifecycleRepository) {

    this.inventoryCycleRepository = inventoryCycleRepository;
    this.inventoryCheckRepository = inventoryCheckRepository;
    this.assetRepository = assetRepository;
    this.assetLifecycleRepository = assetLifecycleRepository;
  }

  /* ======================================================
  CRIAR CICLO DE INVENTÁRIO
  ====================================================== */

  @Transactional
  public InventoryCycle iniciarCiclo() {
    InventoryCycle cycle = InventoryCycle.iniciar();
    return inventoryCycleRepository.save(cycle);
  }

  /* ======================================================
  ADICIONAR ATIVO AO INVENTÁRIO
  ====================================================== */

  @Transactional
  public void adicionarAtivoAoCiclo(UUID inventoryCycleId, UUID assetId) {

    InventoryCycle cycle = getCycle(inventoryCycleId);

    InventoryItem item = InventoryItem.criar(assetId);
    cycle.adicionarItem(item);

    inventoryCycleRepository.save(cycle);
  }

  /* ======================================================
  REGISTRAR CHECK DE INVENTÁRIO
  ====================================================== */

  @Transactional
  public void registrarCheck(
      UUID inventoryCycleId, UUID assetId, InventoryCheckResult result, UUID checkedBy) {

    InventoryCycle cycle = getCycle(inventoryCycleId);

    InventoryItem item =
        cycle.getItems().stream()
            .filter(i -> i.getAssetId().equals(assetId))
            .findFirst()
            .orElseThrow(
                () -> new IllegalStateException("Ativo não pertence a este ciclo de inventário"));

    item.registrarResultado(result);

    InventoryCheck check = InventoryCheck.registrar(inventoryCycleId, assetId, result, checkedBy);

    inventoryCheckRepository.save(check);

    inventoryCycleRepository.save(cycle);
  }

  /* ======================================================
  FECHAR CICLO DE INVENTÁRIO
  ====================================================== */

  @Transactional
  public void fecharCiclo(UUID inventoryCycleId, UUID closedBy) {

    InventoryCycle cycle = getCycle(inventoryCycleId);
    cycle.fechar();

    inventoryCycleRepository.save(cycle);

    // Impacto no Asset após fechamento
    cycle
        .getItems()
        .forEach(
            item -> {
              Asset asset = getAsset(item.getAssetId());
              AssetStatus previousStatus = asset.getStatus();

              if (item.isNaoLocalizado()) {
                asset.marcarNaoLocalizado();
                assetLifecycleRepository.save(
                    AssetLifecycleEvent.create(
                        asset.getId(),
                        previousStatus,
                        asset.getStatus(),
                        AssetAction.MARCAR_NAO_LOCALIZADO,
                        inventoryCycleId,
                        closedBy,
                        "Ativo não localizado no inventário"));
              }
            });

    // Persistir ativos alterados
    cycle
        .getItems()
        .forEach(
            item -> {
              Asset asset = getAsset(item.getAssetId());
              assetRepository.save(asset);
            });
  }

  /* ======================================================
  APOIO
  ====================================================== */

  private InventoryCycle getCycle(UUID inventoryCycleId) {
    return inventoryCycleRepository
        .findById(inventoryCycleId)
        .orElseThrow(() -> new IllegalStateException("Ciclo de inventário não encontrado"));
  }

  private Asset getAsset(UUID assetId) {
    return assetRepository
        .findById(assetId)
        .orElseThrow(() -> new IllegalStateException("Ativo não encontrado"));
  }
}
