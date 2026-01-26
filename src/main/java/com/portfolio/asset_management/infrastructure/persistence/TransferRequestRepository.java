package com.portfolio.asset_management.infrastructure.persistence;

import com.portfolio.asset_management.domain.transfer.TransferRequest;
import com.portfolio.asset_management.domain.transfer.TransferStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repositório responsável pela persistência
 * das solicitações de transferência.
 *
 * NÃO contém regra de negócio.
 */
@Repository
public interface TransferRequestRepository extends JpaRepository<TransferRequest, UUID> {

    /**
     * Verifica se já existe uma solicitação de transferência
     * pendente para o ativo informado.
     */
    boolean existsByAssetIdAndStatus(UUID assetId, TransferStatus status);

    /**
     * Busca a solicitação pendente de um ativo, se existir.
     */
    Optional<TransferRequest> findByAssetIdAndStatus(UUID assetId, TransferStatus status);

    /**
     * Lista todas as solicitações pendentes.
     */
    List<TransferRequest> findAllByStatus(TransferStatus status);

    /**
     * Lista todas as solicitações de um ativo.
     */
    List<TransferRequest> findAllByAssetId(UUID assetId);
}
