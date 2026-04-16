package com.portfolio.assetmanagement.application.transfer.service;

import com.portfolio.assetmanagement.application.asset.service.AssetService;
import com.portfolio.assetmanagement.application.audit.service.AuditService;
import com.portfolio.assetmanagement.application.unit.service.UnitService;
import com.portfolio.assetmanagement.domain.asset.entity.Asset;
import com.portfolio.assetmanagement.domain.asset.enums.AssetStatus;
import com.portfolio.assetmanagement.domain.audit.enums.AuditEventType;
import com.portfolio.assetmanagement.domain.transfer.entity.TransferRequest;
import com.portfolio.assetmanagement.domain.unit.entity.Unit;
import com.portfolio.assetmanagement.infrastructure.persistence.transfer.repository.TransferRepository;
import com.portfolio.assetmanagement.security.context.LoggedUserContext;
import com.portfolio.assetmanagement.shared.exception.BusinessException;
import com.portfolio.assetmanagement.shared.exception.ForbiddenException;
import com.portfolio.assetmanagement.shared.exception.NotFoundException;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TransferService {

  private final TransferRepository repository;
  private final AssetService assetService;
  private final UnitService unitService;
  private final LoggedUserContext loggedUser;
  private final TransferValidationService validationService;
  private final TransferConcurrencyService concurrencyService;
  private final AuditService auditService;

  public TransferService(
      TransferRepository repository,
      AssetService assetService,
      UnitService unitService,
      LoggedUserContext loggedUser,
      TransferValidationService validationService,
      TransferConcurrencyService concurrencyService,
      AuditService auditService) {
    this.repository = repository;
    this.assetService = assetService;
    this.unitService = unitService;
    this.loggedUser = loggedUser;
    this.validationService = validationService;
    this.concurrencyService = concurrencyService;
    this.auditService = auditService;
  }

  // 🔒 VALIDAÇÃO DE ACESSO
  private TransferRequest validateAccess(Long transferId) {
    TransferRequest transfer =
        repository
            .findById(transferId)
            .orElseThrow(() -> new NotFoundException("Transferência não encontrada"));

    if (loggedUser.isAdmin()) return transfer;

    if (loggedUser.isManager()) {
      Long unitId = loggedUser.getUnitId();

      if (!transfer.getFromUnit().getId().equals(unitId)
          && !transfer.getToUnit().getId().equals(unitId)) {
        throw new ForbiddenException("Acesso negado à transferência");
      }
      return transfer;
    }

    // OPERADOR
    if (transfer.getAsset().getAssignedUser() == null
        || !transfer.getAsset().getAssignedUser().getId().equals(loggedUser.getUserId())) {
      throw new ForbiddenException("Acesso negado à transferência");
    }

    return transfer;
  }

  @Transactional(rollbackFor = Exception.class)
  public TransferRequest request(Long assetId, Long toUnitId, String reason) {
    Asset asset = assetService.findById(assetId);

    validationService.requireAssetExists(asset);
    validationService.validateOwnership(asset, loggedUser.getOrganizationId());
    validationService.validateAssetAvailableForTransfer(asset);

    // ✅ CORREÇÃO: ativo sem unidade não pode ser transferido
    if (asset.getUnit() == null) {
      throw new BusinessException("Ativo não possui unidade associada e não pode ser transferido");
    }

    Unit toUnit = unitService.findById(toUnitId);

    validationService.validateTargetUnit(asset.getUnit(), toUnit);
    validationService.validateNoActiveTransfer(asset);

    TransferRequest transfer =
        new TransferRequest(asset, asset.getUnit(), toUnit, loggedUser.getUser(), reason);

    asset.changeStatus(AssetStatus.IN_TRANSFER);

    TransferRequest saved = repository.save(transfer);

    auditService.registerEvent(
        AuditEventType.TRANSFER_REQUESTED,
        loggedUser.getUserId(),
        asset.getOrganization().getId(),
        asset.getUnit().getId(),
        saved.getId(),
        "Transferência solicitada para unidade " + toUnit.getName());

    return saved;
  }

  @Transactional(readOnly = true)
  public List<TransferRequest> list() {

    List<TransferRequest> all = repository.findAll();

    if (loggedUser.isAdmin()) {
      return all.stream()
          .filter(
              t -> t.getAsset().getOrganization().getId().equals(loggedUser.getOrganizationId()))
          .collect(Collectors.toList());
    }

    if (loggedUser.isManager()) {
      Long unitId = loggedUser.getUnitId();

      return all.stream()
          .filter(
              t ->
                  (t.getFromUnit() != null && t.getFromUnit().getId().equals(unitId))
                      || (t.getToUnit() != null && t.getToUnit().getId().equals(unitId)))
          .collect(Collectors.toList());
    }

    // OPERADOR
    return all.stream()
        .filter(
            t ->
                t.getAsset().getAssignedUser() != null
                    && t.getAsset().getAssignedUser().getId().equals(loggedUser.getUserId()))
        .collect(Collectors.toList());
  }

  @Transactional(rollbackFor = Exception.class)
  public void approve(Long transferId, String comment) {

    TransferRequest transfer = validateAccess(transferId);

    validationService.validateCanApprove(transfer);

    concurrencyService.executeWithAssetLock(
        transfer.getAsset().getId(),
        () -> {
          transfer.approve(loggedUser.getUser());
          repository.save(transfer);
        });

    auditService.registerEvent(
        AuditEventType.TRANSFER_APPROVED,
        loggedUser.getUserId(),
        transfer.getAsset().getOrganization().getId(),
        transfer.getAsset().getUnit().getId(),
        transfer.getId(),
        "Transferência aprovada");
  }

  @Transactional(rollbackFor = Exception.class)
  public void reject(Long transferId, String comment) {

    TransferRequest transfer = validateAccess(transferId);

    validationService.validateCanReject(transfer);

    concurrencyService.executeWithAssetLock(
        transfer.getAsset().getId(),
        () -> {
          transfer.reject(loggedUser.getUser());
          transfer.getAsset().changeStatus(AssetStatus.AVAILABLE);
          repository.save(transfer);
        });

    auditService.registerEvent(
        AuditEventType.TRANSFER_REJECTED,
        loggedUser.getUserId(),
        transfer.getAsset().getOrganization().getId(),
        transfer.getAsset().getUnit().getId(),
        transfer.getId(),
        "Transferência rejeitada");
  }

  @Transactional(rollbackFor = Exception.class)
  public void complete(Long transferId) {

    TransferRequest transfer = validateAccess(transferId);

    validationService.validateCanComplete(transfer);

    concurrencyService.executeWithAssetLock(
        transfer.getAsset().getId(),
        () -> {
          Asset asset = transfer.getAsset();
          asset.completeTransfer(transfer.getToUnit());
          transfer.complete();
          repository.save(transfer);
        });

    auditService.registerEvent(
        AuditEventType.TRANSFER_COMPLETED,
        loggedUser.getUserId(),
        transfer.getAsset().getOrganization().getId(),
        transfer.getToUnit().getId(),
        transfer.getId(),
        "Transferência concluída");
  }

  @Transactional(rollbackFor = Exception.class)
  public void cancel(Long transferId) {

    TransferRequest transfer = validateAccess(transferId);

    validationService.validateCanCancel(transfer);

    concurrencyService.executeWithAssetLock(
        transfer.getAsset().getId(),
        () -> {
          transfer.cancel();
          transfer.getAsset().changeStatus(AssetStatus.AVAILABLE);
          repository.save(transfer);
        });

    auditService.registerEvent(
        AuditEventType.TRANSFER_CANCELLED,
        loggedUser.getUserId(),
        transfer.getAsset().getOrganization().getId(),
        transfer.getAsset().getUnit().getId(),
        transfer.getId(),
        "Transferência cancelada");
  }
}
