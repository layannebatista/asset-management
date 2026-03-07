package com.portfolio.assetmanagement.infrastructure.persistence.maintenance.repository;

import com.portfolio.assetmanagement.domain.maintenance.entity.MaintenanceRecord;
import com.portfolio.assetmanagement.domain.maintenance.enums.MaintenanceStatus;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface MaintenanceRepository
    extends JpaRepository<MaintenanceRecord, Long>, JpaSpecificationExecutor<MaintenanceRecord> {

  List<MaintenanceRecord> findByAssetIdOrderByCreatedAtDesc(Long assetId);

  List<MaintenanceRecord> findByOrganizationIdOrderByCreatedAtDesc(Long organizationId);

  List<MaintenanceRecord> findByUnitIdOrderByCreatedAtDesc(Long unitId);

  Optional<MaintenanceRecord> findByAssetIdAndStatusIn(
      Long assetId, List<MaintenanceStatus> statuses);

  boolean existsByAssetIdAndStatusIn(Long assetId, List<MaintenanceStatus> statuses);

  List<MaintenanceRecord> findByStatusIn(List<MaintenanceStatus> statuses);

  List<MaintenanceRecord> findByStatusInOrderByCreatedAtAsc(List<MaintenanceStatus> statuses);

  List<MaintenanceRecord> findByOrganizationIdAndStatusIn(
      Long organizationId, List<MaintenanceStatus> statuses);

  List<MaintenanceRecord> findByUnitIdAndStatusIn(Long unitId, List<MaintenanceStatus> statuses);

  /** Para exportação CSV e orçamento sem filtro de unidade. */
  List<MaintenanceRecord> findByOrganizationIdAndCreatedAtBetween(
      Long organizationId, OffsetDateTime start, OffsetDateTime end);

  /** Para orçamento com filtro de unidade. */
  List<MaintenanceRecord> findByOrganizationIdAndUnitIdAndCreatedAtBetween(
      Long organizationId, Long unitId, OffsetDateTime start, OffsetDateTime end);
}
