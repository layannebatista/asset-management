package com.portfolio.assetmanagement.infrastructure.persistence.transfer.repository;

import com.portfolio.assetmanagement.domain.transfer.entity.TransferRequest;
import com.portfolio.assetmanagement.domain.transfer.enums.TransferStatus;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface TransferRepository
    extends JpaRepository<TransferRequest, Long>, JpaSpecificationExecutor<TransferRequest> {

  List<TransferRequest> findByFromUnit_Id(Long unitId);

  List<TransferRequest> findByToUnit_Id(Long unitId);

  List<TransferRequest> findByAsset_Id(Long assetId);

  Optional<TransferRequest> findByAsset_IdAndStatusIn(Long assetId, List<TransferStatus> statuses);

  boolean existsByAsset_IdAndStatusIn(Long assetId, List<TransferStatus> statuses);
}
