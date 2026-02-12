package com.portfolio.asset_management.asset.repository;

import com.portfolio.asset_management.asset.entity.AssetAssignmentHistory;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AssetAssignmentHistoryRepository
    extends JpaRepository<AssetAssignmentHistory, Long> {

  List<AssetAssignmentHistory> findByAssetIdOrderByChangedAtDesc(Long assetId);
}
