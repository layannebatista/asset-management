package com.portfolio.assetmanagement.infrastructure.persistence.transfer.repository;

import com.portfolio.assetmanagement.domain.transfer.entity.TransferRequest;
import com.portfolio.assetmanagement.domain.transfer.enums.TransferStatus;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TransferRepository extends JpaRepository<TransferRequest, Long> {

  /** Lista transferências pela unidade de origem. */
  List<TransferRequest> findByFromUnit_Id(Long unitId);

  /** Lista transferências pela unidade destino. */
  List<TransferRequest> findByToUnit_Id(Long unitId);

  /** Lista transferências por asset. */
  List<TransferRequest> findByAsset_Id(Long assetId);

  /** Busca transferência ativa por asset. */
  Optional<TransferRequest> findByAsset_IdAndStatusIn(Long assetId, List<TransferStatus> statuses);

  /** Verifica existência de transferência ativa. Usado para proteção contra concorrência. */
  boolean existsByAsset_IdAndStatusIn(Long assetId, List<TransferStatus> statuses);
}