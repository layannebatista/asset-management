package com.portfolio.asset_management.asset.repository;

import com.portfolio.asset_management.asset.entity.Asset;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AssetRepository extends JpaRepository<Asset, Long> {

  /** Busca asset por assetTag. */
  Optional<Asset> findByAssetTag(String assetTag);

  /** Verifica existência por assetTag. */
  boolean existsByAssetTag(String assetTag);

  /** Lista assets por organization. */
  List<Asset> findByOrganization_Id(Long organizationId);

  /** Lista assets por unit. */
  List<Asset> findByUnit_Id(Long unitId);

  /** Lista assets por user atribuído. */
  List<Asset> findByAssignedUser_Id(Long userId);

  /** Verifica existência por id e organization. */
  boolean existsByIdAndOrganization_Id(Long id, Long organizationId);

  /** Busca asset por id e organization. */
  Optional<Asset> findByIdAndOrganization_Id(Long id, Long organizationId);
}
