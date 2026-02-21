package com.portfolio.assetmanagement.application.maintenance.service;

import com.portfolio.assetmanagement.domain.asset.entity.Asset;
import com.portfolio.assetmanagement.domain.asset.enums.AssetStatus;
import com.portfolio.assetmanagement.domain.maintenance.entity.MaintenanceRecord;
import com.portfolio.assetmanagement.domain.maintenance.enums.MaintenanceStatus;
import com.portfolio.assetmanagement.infrastructure.persistence.maintenance.repository.MaintenanceRepository;
import com.portfolio.assetmanagement.security.context.LoggedUserContext;
import com.portfolio.assetmanagement.shared.exception.BusinessException;
import com.portfolio.assetmanagement.shared.exception.ForbiddenException;
import com.portfolio.assetmanagement.shared.exception.ValidationException;
import java.util.List;
import org.springframework.stereotype.Service;

/**
 * Serviço central de validação de Maintenance.
 *
 * <p>Centraliza TODAS as regras de negócio para evitar duplicação.
 *
 * <p>Compatível com MaintenanceService atual.
 */
@Service
public class MaintenanceValidationService {

  private final MaintenanceRepository maintenanceRepository;

  private final LoggedUserContext loggedUser;

  public MaintenanceValidationService(
      MaintenanceRepository maintenanceRepository, LoggedUserContext loggedUser) {

    this.maintenanceRepository = maintenanceRepository;
    this.loggedUser = loggedUser;
  }

  /** Validação de criação. */
  public void validateCreate(Asset asset, String description) {

    if (asset == null) {

      throw new IllegalArgumentException("asset é obrigatório");
    }

    if (!asset.getOrganization().getId().equals(loggedUser.getOrganizationId())) {

      throw new ForbiddenException("Você não tem permissão para este ativo");
    }

    if (description == null || description.isBlank()) {

      throw new ValidationException("Descrição é obrigatória");
    }

    if (asset.getStatus() == AssetStatus.RETIRED
        || asset.getStatus() == AssetStatus.IN_TRANSFER
        || asset.getStatus() == AssetStatus.IN_MAINTENANCE) {

      throw new ValidationException("Este ativo não pode entrar em manutenção");
    }

    boolean exists =
        maintenanceRepository.existsByAssetIdAndStatusIn(
            asset.getId(), List.of(MaintenanceStatus.REQUESTED, MaintenanceStatus.IN_PROGRESS));

    if (exists) {

      throw new ValidationException("Já existe manutenção ativa para este ativo");
    }
  }

  /** Validação de início. */
  public void validateStart(MaintenanceRecord record) {

    validateOwnership(record);

    if (record.getStatus() != MaintenanceStatus.REQUESTED) {

      throw new BusinessException("Manutenção não pode ser iniciada neste estado");
    }
  }

  /** Validação de conclusão. */
  public void validateComplete(MaintenanceRecord record, String resolution) {

    validateOwnership(record);

    if (record.getStatus() != MaintenanceStatus.IN_PROGRESS) {

      throw new BusinessException("Manutenção não pode ser concluída neste estado");
    }

    if (resolution == null || resolution.isBlank()) {

      throw new ValidationException("Resolução é obrigatória");
    }
  }

  /** Validação de cancelamento. */
  public void validateCancel(MaintenanceRecord record) {

    validateOwnership(record);

    if (record.getStatus() == MaintenanceStatus.COMPLETED) {

      throw new BusinessException("Manutenção já foi concluída");
    }

    if (record.getStatus() == MaintenanceStatus.CANCELLED) {

      throw new BusinessException("Manutenção já foi cancelada");
    }
  }

  /** Valida ownership multi-tenant. */
  private void validateOwnership(MaintenanceRecord record) {

    if (!record.getOrganizationId().equals(loggedUser.getOrganizationId())) {

      throw new ForbiddenException("Você não tem permissão para esta manutenção");
    }
  }
}
