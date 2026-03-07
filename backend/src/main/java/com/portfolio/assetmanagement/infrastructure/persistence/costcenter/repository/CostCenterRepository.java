package com.portfolio.assetmanagement.infrastructure.persistence.costcenter.repository;

import com.portfolio.assetmanagement.domain.costcenter.entity.CostCenter;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CostCenterRepository extends JpaRepository<CostCenter, Long> {

  List<CostCenter> findByOrganizationIdAndActiveTrue(Long organizationId);

  Optional<CostCenter> findByOrganizationIdAndCode(Long organizationId, String code);

  boolean existsByOrganizationIdAndCode(Long organizationId, String code);
}
