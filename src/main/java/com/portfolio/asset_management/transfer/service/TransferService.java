package com.portfolio.asset_management.transfer.service;

import com.portfolio.asset_management.asset.entity.Asset;
import com.portfolio.asset_management.asset.enums.AssetStatus;
import com.portfolio.asset_management.asset.service.AssetService;
import com.portfolio.asset_management.audit.enums.AuditEventType;
import com.portfolio.asset_management.audit.service.AuditService;
import com.portfolio.asset_management.security.context.LoggedUserContext;
import com.portfolio.asset_management.shared.exception.BusinessException;
import com.portfolio.asset_management.shared.exception.NotFoundException;
import com.portfolio.asset_management.transfer.entity.TransferRequest;
import com.portfolio.asset_management.transfer.repository.TransferRepository;
import com.portfolio.asset_management.unit.entity.Unit;
import com.portfolio.asset_management.unit.service.UnitService;
import jakarta.transaction.Transactional;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class TransferService {

  private final TransferRepository repository;
  private final AssetService assetService;
  private final UnitService unitService;
  private final AuditService auditService;
  private final LoggedUserContext loggedUser;

  public TransferService(
      TransferRepository repository,
      AssetService assetService,
      UnitService unitService,
      AuditService auditService,
      LoggedUserContext loggedUser) {

    this.repository = repository;
    this.assetService = assetService;
    this.unitService = unitService;
    this.auditService = auditService;
    this.loggedUser = loggedUser;
  }

  @Transactional
  public TransferRequest request(Long assetId, Long toUnitId, String reason) {

    Asset asset = assetService.findById(assetId);

    if (asset.getStatus() != AssetStatus.AVAILABLE
        && asset.getStatus() != AssetStatus.ASSIGNED) {

      throw new BusinessException("Ativo não pode ser transferido neste estado");
    }

    Unit toUnit = unitService.findById(toUnitId);

    TransferRequest transfer =
        new TransferRequest(asset, asset.getUnit(), toUnit, loggedUser.getUser(), reason);

    asset.setStatus(AssetStatus.IN_TRANSFER);

    TransferRequest saved = repository.save(transfer);

    auditService.registerEvent(
        AuditEventType.ASSET_TRANSFERRED,
        loggedUser.getUserId(),
        asset.getOrganization().getId(),
        asset.getUnit().getId(),
        asset.getId(),
        "Transfer requested");

    return saved;
  }

  public List<TransferRequest> list() {

    return repository.findByFromUnit_Id(loggedUser.getUnitId());
  }

  @Transactional
  public void approve(Long transferId, String comment) {

    TransferRequest transfer =
        repository
            .findById(transferId)
            .orElseThrow(() -> new NotFoundException("Transferência não encontrada"));

    transfer.approve(loggedUser.getUser());

    Asset asset = transfer.getAsset();

    asset.changeUnit(transfer.getToUnit());

    if (asset.getAssignedUser() != null) {
      asset.setStatus(AssetStatus.ASSIGNED);
    } else {
      asset.setStatus(AssetStatus.AVAILABLE);
    }

    auditService.registerEvent(
        AuditEventType.ASSET_TRANSFERRED,
        loggedUser.getUserId(),
        asset.getOrganization().getId(),
        asset.getUnit().getId(),
        asset.getId(),
        "Transfer approved");
  }

  @Transactional
  public void reject(Long transferId, String comment) {

    TransferRequest transfer =
        repository
            .findById(transferId)
            .orElseThrow(() -> new NotFoundException("Transferência não encontrada"));

    transfer.reject(loggedUser.getUser());

    Asset asset = transfer.getAsset();

    if (asset.getAssignedUser() != null) {
      asset.setStatus(AssetStatus.ASSIGNED);
    } else {
      asset.setStatus(AssetStatus.AVAILABLE);
    }

    auditService.registerEvent(
        AuditEventType.ASSET_TRANSFERRED,
        loggedUser.getUserId(),
        asset.getOrganization().getId(),
        asset.getUnit().getId(),
        asset.getId(),
        "Transfer rejected");
  }
}
