package com.portfolio.assetmanagement.infrastructure.persistence.asset.repository;

import com.portfolio.assetmanagement.domain.asset.entity.AssetAssignmentHistory;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AssetAssignmentHistoryRepository
    extends JpaRepository<AssetAssignmentHistory, Long> {

  List<AssetAssignmentHistory> findByAssetIdOrderByChangedAtDesc(Long assetId);
}
