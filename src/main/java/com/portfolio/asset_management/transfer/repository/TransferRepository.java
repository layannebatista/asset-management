package com.portfolio.asset_management.transfer.repository;

import com.portfolio.asset_management.transfer.entity.TransferRequest;
import com.portfolio.asset_management.transfer.enums.TransferStatus;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TransferRepository extends JpaRepository<TransferRequest, Long> {

  List<TransferRequest> findByFromUnit_Id(Long unitId);

  List<TransferRequest> findByToUnit_Id(Long unitId);

  List<TransferRequest> findByAsset_Id(Long assetId);

  Optional<TransferRequest> findByAsset_IdAndStatusIn(Long assetId, List<TransferStatus> statuses);
}
