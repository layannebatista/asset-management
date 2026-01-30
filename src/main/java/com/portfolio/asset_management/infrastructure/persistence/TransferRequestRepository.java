package com.portfolio.asset_management.infrastructure.persistence;

import com.portfolio.asset_management.domain.transfer.TransferRequest;
import com.portfolio.asset_management.domain.transfer.TransferRequestStatus;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TransferRequestRepository
    extends JpaRepository<TransferRequest, UUID> {

  /**
   * Retorna uma TransferRequest ativa para o Asset,
   * se existir.
   *
   * <p>Usado para garantir que não existam
   * duas transferências simultâneas para o mesmo ativo.
   */
  Optional<TransferRequest> findByAssetIdAndStatusIn(
      UUID assetId,
      List<TransferRequestStatus> statuses);

  /**
   * Retorna todas as TransferRequests de um ativo.
   */
  List<TransferRequest> findAllByAssetId(UUID assetId);

  /**
   * Método de conveniência para o service.
   */
  default Optional<TransferRequest> findAtivaByAssetId(UUID assetId) {
    return findByAssetIdAndStatusIn(
        assetId,
        List.of(
            TransferRequestStatus.CRIADA,
            TransferRequestStatus.EM_APROVACAO,
            TransferRequestStatus.APROVADA));
  }
}
