package com.portfolio.asset_management.asset.repository;

import com.portfolio.asset_management.asset.entity.AssetStatusHistory;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AssetStatusHistoryRepository extends JpaRepository<AssetStatusHistory, Long> {

  List<AssetStatusHistory> findByAssetIdOrderByChangedAtDesc(Long assetId);
}
