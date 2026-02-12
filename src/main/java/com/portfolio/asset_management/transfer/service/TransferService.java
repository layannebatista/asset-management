package com.portfolio.asset_management.transfer.service;

import com.portfolio.asset_management.asset.entity.Asset;
import com.portfolio.asset_management.asset.enums.AssetStatus;
import com.portfolio.asset_management.asset.service.AssetService;
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
import org.springframework.stereotype.Service;

/**
 * Service responsável por TODAS as regras de negócio do fluxo de transferências.
 *
 * <p>Mantém compatibilidade total com o TransferController existente.
 */
@Service
public class TransferService {

  private final TransferRepository repository;
  private final AssetService assetService;
  private final UnitService unitService;
  private final LoggedUserContext loggedUser;

  public TransferService(
      TransferRepository repository,
      AssetService assetService,
      UnitService unitService,
      LoggedUserContext loggedUser) {

    this.repository = repository;
    this.assetService = assetService;
    this.unitService = unitService;
    this.loggedUser = loggedUser;
  }

  /** Solicita uma transferência. */
  @Transactional
  public TransferRequest request(Long assetId, Long toUnitId, String reason) {

    Asset asset = assetService.findById(assetId);

    if (asset.getStatus() != AssetStatus.AVAILABLE) {

      throw new BusinessException("Ativo não disponível para transferência");
    }

    Unit toUnit = unitService.findById(toUnitId);

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

    if (transfer.getStatus() != TransferStatus.PENDING) {

      throw new BusinessException("Transferência não pode ser aprovada");
    }

    transfer.approve(loggedUser.getUser());
  }

  /** Rejeita transferência. */
  @Transactional
  public void reject(Long transferId, String comment) {

    TransferRequest transfer =
        repository
            .findById(transferId)
            .orElseThrow(() -> new NotFoundException("Transferência não encontrada"));

    if (transfer.getStatus() != TransferStatus.PENDING) {

      throw new BusinessException("Transferência não pode ser rejeitada");
    }

    transfer.reject(loggedUser.getUser());

    Asset asset = transfer.getAsset();

    asset.changeStatus(AssetStatus.AVAILABLE);
  }

  /** Completa transferência. */
  @Transactional
  public void complete(Long transferId) {

    TransferRequest transfer =
        repository
            .findById(transferId)
            .orElseThrow(() -> new NotFoundException("Transferência não encontrada"));

    if (transfer.getStatus() != TransferStatus.APPROVED) {

      throw new BusinessException("Transferência deve estar aprovada");
    }

    Asset asset = transfer.getAsset();

    asset.changeUnit(transfer.getToUnit());

    asset.changeStatus(AssetStatus.AVAILABLE);

    transfer.complete();
  }
}
