package com.portfolio.asset_management.maintenance.repository;

import com.portfolio.asset_management.maintenance.entity.MaintenanceRecord;
import com.portfolio.asset_management.maintenance.enums.MaintenanceStatus;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MaintenanceRepository extends JpaRepository<MaintenanceRecord, Long> {

  /** Histórico completo de manutenção de um asset. */
  List<MaintenanceRecord> findByAssetIdOrderByCreatedAtDesc(Long assetId);

  /** Histórico completo por organization. */
  List<MaintenanceRecord> findByOrganizationIdOrderByCreatedAtDesc(Long organizationId);

  /** Histórico completo por unit. */
  List<MaintenanceRecord> findByUnitIdOrderByCreatedAtDesc(Long unitId);

  /** Busca manutenção ativa. Usado para controle de concorrência. */
  Optional<MaintenanceRecord> findByAssetIdAndStatusIn(
      Long assetId, List<MaintenanceStatus> statuses);

  /** Verifica existência de manutenção ativa. Muito mais eficiente que find(). */
  boolean existsByAssetIdAndStatusIn(Long assetId, List<MaintenanceStatus> statuses);

  /** Lista por status. */
  List<MaintenanceRecord> findByStatusIn(List<MaintenanceStatus> statuses);

  /** Lista manutenções ativas. */
  List<MaintenanceRecord> findByStatusInOrderByCreatedAtAsc(List<MaintenanceStatus> statuses);

  /** Busca manutenções abertas de uma organization. */
  List<MaintenanceRecord> findByOrganizationIdAndStatusIn(
      Long organizationId, List<MaintenanceStatus> statuses);

  /** Busca manutenções abertas de uma unit. */
  List<MaintenanceRecord> findByUnitIdAndStatusIn(Long unitId, List<MaintenanceStatus> statuses);
}
