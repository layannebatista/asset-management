package com.portfolio.asset_management.infrastructure.persistence;

import com.portfolio.asset_management.domain.transfer.Transfer;
import com.portfolio.asset_management.domain.transfer.TransferRequestStatus;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repositório de persistência do processo de Transferência.
 *
 * <p>Responsável exclusivamente por acesso a dados. Nenhuma regra de negócio deve existir aqui.
 */
@Repository
public interface TransferRepository extends JpaRepository<Transfer, UUID> {

  /**
   * Retorna a transferência ativa (se existir) de um ativo.
   *
   * <p>Usado para garantir que não existam duas transferências simultâneas para o mesmo ativo.
   */
  Optional<Transfer> findByAssetIdAndRequestStatusIn(
      UUID assetId, List<TransferRequestStatus> requestStatuses);

  /** Retorna todas as transferências de um ativo. */
  List<Transfer> findAllByAssetId(UUID assetId);

  /** Retorna transferências por status. */
  List<Transfer> findAllByRequestStatus(TransferRequestStatus requestStatus);
}
