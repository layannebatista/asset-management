package com.portfolio.asset_management.infrastructure.persistence;

import com.portfolio.asset_management.domain.maintenance.MaintenanceRequest;
import com.portfolio.asset_management.domain.maintenance.MaintenanceRequestStatus;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repositório da MaintenanceRequest.
 *
 * <p>Responsável exclusivamente por persistência. Nenhuma regra de negócio deve existir aqui.
 */
@Repository
public interface MaintenanceRequestRepository extends JpaRepository<MaintenanceRequest, UUID> {

  /**
   * Retorna uma solicitação de manutenção ativa para o ativo, se existir.
   *
   * <p>Usado para garantir que não existam duas manutenções simultâneas para o mesmo ativo.
   */
  Optional<MaintenanceRequest> findByAssetIdAndStatusIn(
      UUID assetId, List<MaintenanceRequestStatus> statuses);

  /** Retorna todas as solicitações de manutenção de um ativo. */
  List<MaintenanceRequest> findAllByAssetId(UUID assetId);

  /** Método de conveniência para o service. */
  default Optional<MaintenanceRequest> findAtivaByAssetId(UUID assetId) {
    return findByAssetIdAndStatusIn(
        assetId, List.of(MaintenanceRequestStatus.CRIADA, MaintenanceRequestStatus.EM_MANUTENCAO));
  }
}
