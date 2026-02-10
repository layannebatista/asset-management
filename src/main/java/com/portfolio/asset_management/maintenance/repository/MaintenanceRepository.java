package com.portfolio.asset_management.maintenance.repository;

import com.portfolio.asset_management.maintenance.entity.MaintenanceRecord;
import com.portfolio.asset_management.maintenance.enums.MaintenanceStatus;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MaintenanceRepository extends JpaRepository<MaintenanceRecord, Long> {

  /** Retorna o histórico de manutenção de um ativo. */
  List<MaintenanceRecord> findByAssetIdOrderByCreatedAtDesc(Long assetId);

  /** Retorna todos os registros de manutenção de uma organização. */
  List<MaintenanceRecord> findByOrganizationIdOrderByCreatedAtDesc(Long organizationId);

  /** Retorna todos os registros de manutenção de uma unidade. */
  List<MaintenanceRecord> findByUnitIdOrderByCreatedAtDesc(Long unitId);

  /** Verifica se existe manutenção ativa para um ativo. */
  Optional<MaintenanceRecord> findByAssetIdAndStatusIn(
      Long assetId, List<MaintenanceStatus> statuses);

  /** Retorna registros com status específicos. */
  List<MaintenanceRecord> findByStatusIn(List<MaintenanceStatus> statuses);
}
