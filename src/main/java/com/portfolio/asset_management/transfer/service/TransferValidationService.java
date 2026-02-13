package com.portfolio.asset_management.transfer.service;

import com.portfolio.asset_management.asset.entity.Asset;
import com.portfolio.asset_management.asset.enums.AssetStatus;
import com.portfolio.asset_management.shared.exception.BusinessException;
import com.portfolio.asset_management.shared.exception.ForbiddenException;
import com.portfolio.asset_management.shared.exception.NotFoundException;
import com.portfolio.asset_management.transfer.entity.TransferRequest;
import com.portfolio.asset_management.transfer.enums.TransferStatus;
import com.portfolio.asset_management.transfer.repository.TransferRepository;
import com.portfolio.asset_management.unit.entity.Unit;
import java.util.List;
import org.springframework.stereotype.Service;

/**
 * Serviço responsável por validações de transferência.
 *
 * <p>Compatível com o TransferService hardened atual.
 */
@Service
public class TransferValidationService {

  private final TransferRepository transferRepository;

  public TransferValidationService(TransferRepository transferRepository) {

    this.transferRepository = transferRepository;
  }

  /** Garante que asset existe. */
  public void requireAssetExists(Asset asset) {

    if (asset == null) {

      throw new NotFoundException("Ativo não encontrado");
    }
  }

  /** Garante que usuário possui acesso ao asset. */
  public void validateOwnership(Asset asset, Long organizationId) {

    if (!asset.getOrganization().getId().equals(organizationId)) {

      throw new ForbiddenException("Você não tem permissão para este ativo");
    }
  }

  /** Garante que asset está disponível. */
  public void validateAssetAvailableForTransfer(Asset asset) {

    if (asset.getStatus() != AssetStatus.AVAILABLE) {

      throw new BusinessException("Ativo não está disponível para transferência");
    }
  }

  /** Garante unidade destino válida. */
  public void validateTargetUnit(Unit fromUnit, Unit toUnit) {

    if (toUnit == null) {

      throw new NotFoundException("Unidade destino não encontrada");
    }

    if (fromUnit.getId().equals(toUnit.getId())) {

      throw new BusinessException("Transferência para mesma unidade não é permitida");
    }

    if (!fromUnit.getOrganization().getId().equals(toUnit.getOrganization().getId())) {

      throw new BusinessException("Transferência entre organizações não é permitida");
    }
  }

  /** Garante que não existe transferência ativa. */
  public void validateNoActiveTransfer(Asset asset) {

    boolean exists =
        transferRepository.existsByAsset_IdAndStatusIn(
            asset.getId(), List.of(TransferStatus.PENDING, TransferStatus.APPROVED));

    if (exists) {

      throw new BusinessException("Já existe transferência ativa para este ativo");
    }
  }

  /** Garante que pode aprovar. */
  public void validateCanApprove(TransferRequest transfer) {

    if (transfer.getStatus() != TransferStatus.PENDING) {

      throw new BusinessException("Transferência não pode ser aprovada");
    }
  }

  /** Garante que pode rejeitar. */
  public void validateCanReject(TransferRequest transfer) {

    if (transfer.getStatus() != TransferStatus.PENDING) {

      throw new BusinessException("Transferência não pode ser rejeitada");
    }
  }

  /** Garante que pode completar. */
  public void validateCanComplete(TransferRequest transfer) {

    if (transfer.getStatus() != TransferStatus.APPROVED) {

      throw new BusinessException("Transferência deve estar aprovada");
    }
  }
}
