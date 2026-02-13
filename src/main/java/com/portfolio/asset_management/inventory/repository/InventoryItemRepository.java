package com.portfolio.asset_management.inventory.repository;

import com.portfolio.asset_management.inventory.entity.InventoryItem;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface InventoryItemRepository extends JpaRepository<InventoryItem, Long> {

  /** Lista itens por sessão. */
  List<InventoryItem> findBySession_Id(Long sessionId);

  /** Lista itens por asset. */
  List<InventoryItem> findByAsset_Id(Long assetId);

  /** Busca item específico por sessão e asset. */
  Optional<InventoryItem> findBySession_IdAndAsset_Id(Long sessionId, Long assetId);

  /** Verifica existência de item na sessão. */
  boolean existsBySession_IdAndAsset_Id(Long sessionId, Long assetId);

  /** Conta itens por sessão. */
  long countBySession_Id(Long sessionId);
}
