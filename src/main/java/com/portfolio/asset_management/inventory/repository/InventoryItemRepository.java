package com.portfolio.asset_management.inventory.repository;

import com.portfolio.asset_management.inventory.entity.InventoryItem;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InventoryItemRepository extends JpaRepository<InventoryItem, Long> {

  List<InventoryItem> findBySession_Id(Long sessionId);

  List<InventoryItem> findByAsset_Id(Long assetId);
}
