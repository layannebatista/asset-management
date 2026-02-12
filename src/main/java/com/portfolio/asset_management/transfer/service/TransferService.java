package com.portfolio.asset_management.transfer.service;

import com.portfolio.asset_management.asset.entity.Asset;
import com.portfolio.asset_management.asset.enums.AssetStatus;
import com.portfolio.asset_management.asset.service.AssetService;
import com.portfolio.asset_management.asset.service.AssetStatusHistoryService;
import com.portfolio.asset_management.audit.enums.AuditEventType;
import com.portfolio.asset_management.audit.service.AuditService;
import com.portfolio.asset_management.security.context.LoggedUserContext;
import com.portfolio.asset_management.shared.exception.BusinessException;
import com.portfolio.asset_management.shared.exception.NotFoundException;
import com.portfolio.asset_management.transfer.entity.TransferRequest;
import com.portfolio.asset_management.transfer.enums.TransferStatus;
import com.portfolio.asset_management.transfer.repository.TransferRepository;
import com.portfolio.asset_management.unit.entity.Unit;
import com.portfolio.asset_management.unit.service.UnitService;
import jakarta.transaction.Transactional;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;

@Service
public class TransferService {

  private final TransferRepository repository;

  private final AssetService assetService;

  private final UnitService unitService;

  private final LoggedUserContext loggedUser;

  private final AuditService auditService;

  private final AssetStatusHistoryService historyService;

  public TransferService(
      TransferRepository repository,
      AssetService assetService,
      UnitService unitService,
      LoggedUserContext loggedUser,
      AuditService auditService,
      AssetStatusHistoryService historyService) {

    this.repository = repository;
    this.assetService = assetService;
    this.unitService = unitService;
    this.loggedUser = loggedUser;
    this.auditService = auditService;
    this.historyService = historyService;
  }

  @Transactional
  public TransferRequest request(Long assetId, Long toUnitId, String reason) {

    Asset asset = assetService.findById(assetId);

    if (asset.getStatus() != AssetStatus.AVAILABLE) {

      throw new BusinessException("Ativo não disponível para transferência");
    }

    Optional<TransferRequest> existing =
        repository.findByAsset_IdAndStatusIn(
            assetId, List.of(TransferStatus.PENDING, TransferStatus.APPROVED));

    if (existing.isPresent()) {

      throw new BusinessException("Já existe transferência pendente");
    }

    Unit toUnit = unitService.findById(toUnitId);

    TransferRequest transfer =
        new TransferRequest(asset, asset.getUnit(), toUnit, loggedUser.getUser(), reason);

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

    if (transfer.getStatus() != TransferStatus.PENDING) {

      throw new BusinessException("Transferência inválida");
    }

    transfer.approve(loggedUser.getUser());

    Asset asset = transfer.getAsset();

    AssetStatus previous = asset.getStatus();

    asset.changeUnit(transfer.getToUnit());

    asset.setStatus(AssetStatus.AVAILABLE);

    historyService.registerStatusChange(asset, previous, asset.getStatus());

    auditService.registerEvent(
        AuditEventType.ASSET_TRANSFERRED,
        loggedUser.getUserId(),
        asset.getOrganization().getId(),
        transfer.getToUnit().getId(),
        asset.getId(),
        "Transfer approved");
  }

  @Transactional
  public void reject(Long transferId, String comment) {

    TransferRequest transfer =
        repository
            .findById(transferId)
            .orElseThrow(() -> new NotFoundException("Transferência não encontrada"));

    if (transfer.getStatus() != TransferStatus.PENDING) {

      throw new BusinessException("Transferência inválida");
    }

    transfer.reject(loggedUser.getUser());

    auditService.registerEvent(
        AuditEventType.ASSET_TRANSFERRED,
        loggedUser.getUserId(),
        transfer.getAsset().getOrganization().getId(),
        transfer.getAsset().getUnit().getId(),
        transfer.getAsset().getId(),
        "Transfer rejected");
  }
}
