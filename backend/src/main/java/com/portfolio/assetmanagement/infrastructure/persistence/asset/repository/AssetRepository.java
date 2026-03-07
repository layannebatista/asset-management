package com.portfolio.assetmanagement.infrastructure.persistence.asset.repository;

import com.portfolio.assetmanagement.domain.asset.entity.Asset;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface AssetRepository
    extends JpaRepository<Asset, Long>, JpaSpecificationExecutor<Asset> {

  Optional<Asset> findByAssetTag(String assetTag);

  boolean existsByAssetTag(String assetTag);

  List<Asset> findByOrganization_Id(Long organizationId);

  List<Asset> findByUnit_Id(Long unitId);

  List<Asset> findByAssignedUser_Id(Long userId);

  boolean existsByIdAndOrganization_Id(Long id, Long organizationId);

  Optional<Asset> findByIdAndOrganization_Id(Long id, Long organizationId);

  /**
   * Lista ativos com campos de depreciação preenchidos. Usado pelo DepreciationService para cálculo
   * de portfólio.
   */
  @Query(
      "SELECT a FROM Asset a WHERE a.organization.id = :orgId "
          + "AND a.purchaseValue IS NOT NULL AND a.usefulLifeMonths IS NOT NULL")
  List<Asset> findByOrganizationIdWithDepreciation(@Param("orgId") Long organizationId);
}
