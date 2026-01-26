package com.portfolio.asset_management.infrastructure.persistence;

import com.portfolio.asset_management.domain.transfer.TransferApproval;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * Repositório responsável pela persistência
 * das decisões de transferência.
 *
 * NÃO contém regra de negócio.
 */
@Repository
public interface TransferApprovalRepository extends JpaRepository<TransferApproval, UUID> {

    /**
     * Verifica se já existe uma decisão para a solicitação informada.
     */
    boolean existsByTransferRequestId(UUID transferRequestId);

    /**
     * Busca a decisão associada à solicitação.
     */
    Optional<TransferApproval> findByTransferRequestId(UUID transferRequestId);
}
