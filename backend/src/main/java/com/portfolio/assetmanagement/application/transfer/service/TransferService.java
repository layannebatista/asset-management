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
import java.util.ArrayList;
import java.util.List;
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

  @Transactional(rollbackFor = Exception.class)
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

  /**
   * M2: A versão anterior usava apenas findByFromUnit_Id, tornando invisíveis as transferências
   * onde a unidade do GESTOR é o destino. Agora combina origem + destino sem duplicatas.
   *
   * <p>D2: adicionado @Transactional(readOnly = true) — TransferRequest tem lazy relations (asset,
   * fromUnit, toUnit) que podem ser acessadas pelo mapper após o retorno.
   */
  @Transactional(readOnly = true)
  public List<TransferRequest> list() {
    Long unitId = loggedUser.getUnitId();
    if (unitId == null) return List.of(); // ADMIN sem unidade

    List<TransferRequest> outgoing = repository.findByFromUnit_Id(unitId);
    List<TransferRequest> incoming = repository.findByToUnit_Id(unitId);

    List<TransferRequest> all = new ArrayList<>(outgoing);
    incoming.stream()
        .filter(t -> all.stream().noneMatch(o -> o.getId().equals(t.getId())))
        .forEach(all::add);

    return all;
  }

  @Transactional(rollbackFor = Exception.class)
  public void approve(Long transferId, String comment) {
    TransferRequest transfer =
        repository
            .findById(transferId)
            .orElseThrow(() -> new NotFoundException("Transferência não encontrada"));
    validationService.validateCanApprove(transfer);
    concurrencyService.executeWithAssetLock(
        transfer.getAsset().getId(),
        () -> {
          transfer.approve(loggedUser.getUser());
          repository.save(transfer);
        });
  }

  @Transactional(rollbackFor = Exception.class)
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
          repository.save(transfer);
        });
  }

  @Transactional(rollbackFor = Exception.class)
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
          asset.completeTransfer(transfer.getToUnit());
          transfer.complete();
          repository.save(transfer);
        });
  }
}
