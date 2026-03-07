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
import org.springframework.stereotype.Service;

@Service
public class MaintenanceValidationService {

  private final MaintenanceRepository maintenanceRepository;
  private final LoggedUserContext loggedUser;

  public MaintenanceValidationService(
      MaintenanceRepository maintenanceRepository, LoggedUserContext loggedUser) {
    this.maintenanceRepository = maintenanceRepository;
    this.loggedUser = loggedUser;
  }

  /**
   * C3: Removida a checagem existsByAssetIdAndStatusIn daqui. MaintenanceLockService já faz essa
   * verificação com lock pessimista ANTES de validateCreate() ser chamado — a checagem aqui era
   * código morto.
   */
  public void validateCreate(Asset asset, String description) {

    if (asset == null) throw new IllegalArgumentException("asset é obrigatório");

    if (!asset.getOrganization().getId().equals(loggedUser.getOrganizationId()))
      throw new ForbiddenException("Você não tem permissão para este ativo");

    if (description == null || description.isBlank())
      throw new ValidationException("Descrição é obrigatória");

    if (asset.getStatus() == AssetStatus.RETIRED
        || asset.getStatus() == AssetStatus.IN_TRANSFER
        || asset.getStatus() == AssetStatus.IN_MAINTENANCE)
      throw new ValidationException("Este ativo não pode entrar em manutenção");
  }

  public void validateStart(MaintenanceRecord record) {
    validateOwnership(record);
    if (record.getStatus() != MaintenanceStatus.REQUESTED)
      throw new BusinessException("Manutenção não pode ser iniciada neste estado");
  }

  public void validateComplete(MaintenanceRecord record, String resolution) {
    validateOwnership(record);
    if (record.getStatus() != MaintenanceStatus.IN_PROGRESS)
      throw new BusinessException("Manutenção não pode ser concluída neste estado");
    if (resolution == null || resolution.isBlank())
      throw new ValidationException("Resolução é obrigatória");
  }

  public void validateCancel(MaintenanceRecord record) {
    validateOwnership(record);
    if (record.getStatus() == MaintenanceStatus.COMPLETED)
      throw new BusinessException("Manutenção já foi concluída");
    if (record.getStatus() == MaintenanceStatus.CANCELLED)
      throw new BusinessException("Manutenção já foi cancelada");
  }

  private void validateOwnership(MaintenanceRecord record) {
    if (!record.getOrganizationId().equals(loggedUser.getOrganizationId()))
      throw new ForbiddenException("Você não tem permissão para esta manutenção");
  }
}
