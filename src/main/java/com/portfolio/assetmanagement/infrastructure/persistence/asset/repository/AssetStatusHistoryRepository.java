package com.portfolio.assetmanagement.infrastructure.persistence.asset.repository;

import com.portfolio.assetmanagement.domain.asset.entity.AssetStatusHistory;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AssetStatusHistoryRepository extends JpaRepository<AssetStatusHistory, Long> {

  List<AssetStatusHistory> findByAssetIdOrderByChangedAtDesc(Long assetId);
}