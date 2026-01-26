package com.portfolio.asset_management.infrastructure.persistence;

import com.portfolio.asset_management.domain.maintenance.Maintenance;
import com.portfolio.asset_management.domain.maintenance.MaintenanceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repositório responsável pela persistência
 * dos processos de manutenção.
 *
 * NÃO contém regra de negócio.
 */
@Repository
public interface MaintenanceRepository extends JpaRepository<Maintenance, UUID> {

    /**
     * Verifica se existe manutenção ativa
     * (ABERTA ou EM_EXECUCAO) para o ativo.
     */
    boolean existsByAssetIdAndStatusIn(UUID assetId, List<MaintenanceStatus> statuses);

    /**
     * Busca a manutenção ativa do ativo, se existir.
     */
    Optional<Maintenance> findByAssetIdAndStatusIn(UUID assetId, List<MaintenanceStatus> statuses);

    /**
     * Lista manutenções por status.
     */
    List<Maintenance> findAllByStatus(MaintenanceStatus status);

    /**
     * Lista todas as manutenções de um ativo.
     */
    List<Maintenance> findAllByAssetId(UUID assetId);
}
