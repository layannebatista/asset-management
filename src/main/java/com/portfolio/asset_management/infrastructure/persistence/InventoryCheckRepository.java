package com.portfolio.asset_management.infrastructure.persistence;

import com.portfolio.asset_management.domain.inventory.InventoryCheck;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repositório de registros históricos de inventário.
 *
 * <p>InventoryCheck é IMUTÁVEL.
 * Este repositório não deve ser usado para atualização.
 */
@Repository
public interface InventoryCheckRepository
    extends JpaRepository<InventoryCheck, UUID> {

  /**
   * Lista checks por ciclo de inventário.
   */
  List<InventoryCheck> findAllByInventoryCycleId(UUID inventoryCycleId);

  /**
   * Lista checks por ativo.
   */
  List<InventoryCheck> findAllByAssetId(UUID assetId);
}
