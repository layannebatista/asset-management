package com.portfolio.asset_management.infrastructure.persistence;

import com.portfolio.asset_management.domain.maintenance.Maintenance;
import com.portfolio.asset_management.domain.maintenance.MaintenanceRequestStatus;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repositório de LEITURA da projeção Maintenance.
 *
 * <p>Este repositório NÃO governa fluxo, NÃO valida regras de negócio e NÃO altera estado de
 * processo.
 *
 * <p>Ele existe exclusivamente para: - consultas - listagens - relatórios
 *
 * <p>O processo oficial de manutenção é controlado por: {@link
 * com.portfolio.asset_management.domain.maintenance.MaintenanceRequest}
 */
@Repository
public interface MaintenanceRepository extends JpaRepository<Maintenance, UUID> {

  /** Lista manutenções de um ativo. */
  List<Maintenance> findAllByAssetId(UUID assetId);

  /**
   * Lista manutenções por status do processo.
   *
   * <p>Status aqui é o STATUS DO PROCESSO, derivado da MaintenanceRequest.
   */
  List<Maintenance> findAllByStatus(MaintenanceRequestStatus status);

  /**
   * Lista manutenções ativas (não finais).
   *
   * <p>Método de conveniência para telas e relatórios. NÃO deve ser usado para validação de fluxo.
   */
  default List<Maintenance> findAtivas() {
    return findAllByStatus(MaintenanceRequestStatus.CRIADA).stream().toList();
  }
}
