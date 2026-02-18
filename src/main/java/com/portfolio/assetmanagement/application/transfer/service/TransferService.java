package com.portfolio.assetmanagement.application.transfer.service;

import com.portfolio.assetmanagement.application.asset.service.AssetService;
import com.portfolio.assetmanagement.application.unit.service.UnitService;
import com.portfolio.assetmanagement.domain.asset.entity.Asset;
import com.portfolio.assetmanagement.domain.asset.enums.AssetStatus;
import com.portfolio.assetmanagement.domain.transfer.entity.TransferRequest;
import com.portfolio.assetmanagement.domain.unit.entity.Unit;
import com.portfolio.assetmanagement.infrastructure.persistence.transfer.repository.TransferRepository;
import com.portfolio.assetmanagement.security.context.LoggedUserContext;
import com.portfolio.assetmanagement.shared.exception.NotFoundException;
import jakarta.transaction.Transactional;
import java.util.List;
import org.springframework.stereotype.Service;

/**
 * Service responsável por TODAS as regras de negócio do fluxo de transferências.
 *
 * <p>Implementação enterprise com:
 *
 * <p>- validação centralizada - proteção contra concorrência - multi-tenant enforcement - lifecycle
 * seguro
 */
@Service
public class TransferService {

  private final TransferRepository repository;

  private final AssetService assetService;

  private final UnitService unitService;

  private final LoggedUserContext loggedUser;

  private final TransferValidationService validationService;

  private final TransferConcurrencyService concurrencyService;

  public TransferService(
      TransferRepository repository,
      AssetService assetService,
      UnitService unitService,
      LoggedUserContext loggedUser,
      TransferValidationService validationService,
      TransferConcurrencyService concurrencyService) {

    this.repository = repository;
    this.assetService = assetService;
    this.unitService = unitService;
    this.loggedUser = loggedUser;
    this.validationService = validationService;
    this.concurrencyService = concurrencyService;
  }

  /** Solicita uma transferência. */
  @Transactional
  public TransferRequest request(Long assetId, Long toUnitId, String reason) {

    Asset asset = assetService.findById(assetId);

    validationService.requireAssetExists(asset);

    validationService.validateOwnership(asset, loggedUser.getOrganizationId());

    validationService.validateAssetAvailableForTransfer(asset);

    Unit toUnit = unitService.findById(toUnitId);

    validationService.validateTargetUnit(asset.getUnit(), toUnit);

    validationService.validateNoActiveTransfer(asset);

    TransferRequest transfer =
        new TransferRequest(asset, asset.getUnit(), toUnit, loggedUser.getUser(), reason);

    asset.changeStatus(AssetStatus.IN_TRANSFER);

    return repository.save(transfer);
  }

  /** Lista transferências da unidade do usuário. */
  public List<TransferRequest> list() {

    return repository.findByFromUnit_Id(loggedUser.getUnitId());
  }

  /** Aprova transferência. */
  @Transactional
  public void approve(Long transferId, String comment) {

    TransferRequest transfer =
        repository
            .findById(transferId)
            .orElseThrow(() -> new NotFoundException("Transferência não encontrada"));

    validationService.validateCanApprove(transfer);

    concurrencyService.executeWithAssetLock(
        transfer.getAsset().getId(), () -> transfer.approve(loggedUser.getUser()));
  }

  /** Rejeita transferência. */
  @Transactional
  public void reject(Long transferId, String comment) {

    TransferRequest transfer =
        repository
            .findById(transferId)
            .orElseThrow(() -> new NotFoundException("Transferência não encontrada"));

    validationService.validateCanReject(transfer);

    concurrencyService.executeWithAssetLock(
        transfer.getAsset().getId(),
        () -> {
          transfer.reject(loggedUser.getUser());

          transfer.getAsset().changeStatus(AssetStatus.AVAILABLE);
        });
  }

  /** Completa transferência. */
  @Transactional
  public void complete(Long transferId) {

    TransferRequest transfer =
        repository
            .findById(transferId)
            .orElseThrow(() -> new NotFoundException("Transferência não encontrada"));

    validationService.validateCanComplete(transfer);

    concurrencyService.executeWithAssetLock(
        transfer.getAsset().getId(),
        () -> {
          Asset asset = transfer.getAsset();

          asset.changeUnit(transfer.getToUnit());

          asset.changeStatus(AssetStatus.AVAILABLE);

          transfer.complete();
        });
  }
}
