package com.portfolio.asset_management.infrastructure.persistence;

import com.portfolio.asset_management.domain.inventory.InventoryCheck;
import com.portfolio.asset_management.domain.inventory.InventoryCheckResult;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repositório responsável pela persistência das conferências de inventário.
 *
 * <p>NÃO contém regra de negócio.
 */
@Repository
public interface InventoryCheckRepository extends JpaRepository<InventoryCheck, UUID> {

  /** Verifica se um ativo já foi conferido dentro de um ciclo de inventário. */
  boolean existsByInventoryCycleIdAndAssetId(UUID inventoryCycleId, UUID assetId);

  /** Lista todas as conferências de um ciclo. */
  List<InventoryCheck> findAllByInventoryCycleId(UUID inventoryCycleId);

  /** Lista todos os ativos não localizados em um ciclo. */
  List<InventoryCheck> findAllByInventoryCycleIdAndResult(
      UUID inventoryCycleId, InventoryCheckResult result);
}
