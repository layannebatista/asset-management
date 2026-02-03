package com.portfolio.asset_management.asset.repository;

import com.portfolio.asset_management.asset.entity.Asset;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AssetRepository extends JpaRepository<Asset, Long> {

  Optional<Asset> findByAssetTag(String assetTag);

  List<Asset> findByOrganization_Id(Long organizationId);

  List<Asset> findByUnit_Id(Long unitId);

  List<Asset> findByAssignedUser_Id(Long userId);
}
