package com.portfolio.asset_management.maintenance.service;

import com.portfolio.asset_management.asset.entity.Asset;
import com.portfolio.asset_management.asset.enums.AssetStatus;
import com.portfolio.asset_management.asset.repository.AssetRepository;
import com.portfolio.asset_management.audit.enums.AuditEventType;
import com.portfolio.asset_management.audit.service.AuditService;
import com.portfolio.asset_management.maintenance.entity.MaintenanceRecord;
import com.portfolio.asset_management.maintenance.enums.MaintenanceStatus;
import com.portfolio.asset_management.maintenance.repository.MaintenanceRepository;
import com.portfolio.asset_management.security.context.LoggedUserContext;
import com.portfolio.asset_management.shared.exception.ForbiddenException;
import com.portfolio.asset_management.shared.exception.NotFoundException;
import com.portfolio.asset_management.shared.exception.ValidationException;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MaintenanceService {

  private final MaintenanceRepository maintenanceRepository;
  private final AssetRepository assetRepository;
  private final AuditService auditService;
  private final LoggedUserContext loggedUserContext;

  public MaintenanceService(
      MaintenanceRepository maintenanceRepository,
      AssetRepository assetRepository,
      AuditService auditService,
      LoggedUserContext loggedUserContext) {

    this.maintenanceRepository = maintenanceRepository;
    this.assetRepository = assetRepository;
    this.auditService = auditService;
    this.loggedUserContext = loggedUserContext;
  }

  @Transactional
  public MaintenanceRecord create(Long assetId, String description) {

    Asset asset =
        assetRepository
            .findById(assetId)
            .orElseThrow(() -> new NotFoundException("Ativo não encontrado"));

    Long organizationId = loggedUserContext.getOrganizationId();

    if (!asset.getOrganization().getId().equals(organizationId)) {
      throw new ForbiddenException("Você não tem permissão para este ativo");
    }

    if (asset.getStatus() == AssetStatus.RETIRED
        || asset.getStatus() == AssetStatus.IN_TRANSFER
        || asset.getStatus() == AssetStatus.IN_MAINTENANCE) {

      throw new ValidationException("Este ativo não pode entrar em manutenção");
    }

    Optional<MaintenanceRecord> active =
        maintenanceRepository.findByAssetIdAndStatusIn(
            assetId, List.of(MaintenanceStatus.REQUESTED, MaintenanceStatus.IN_PROGRESS));

    if (active.isPresent()) {
      throw new ValidationException("Já existe manutenção ativa para este ativo");
    }

    MaintenanceRecord record =
        new MaintenanceRecord(
            asset,
            asset.getOrganization().getId(),
            asset.getUnit().getId(),
            loggedUserContext.getUserId(),
            description);

    MaintenanceRecord saved = maintenanceRepository.save(record);

    auditService.registerEvent(
        AuditEventType.ASSET_STATUS_CHANGED,
        loggedUserContext.getUserId(),
        asset.getOrganization().getId(),
        asset.getUnit().getId(),
        asset.getId(),
        "Manutenção solicitada");

    return saved;
  }

  @Transactional
  public MaintenanceRecord start(Long maintenanceId) {

    MaintenanceRecord record =
        maintenanceRepository
            .findById(maintenanceId)
            .orElseThrow(() -> new NotFoundException("Manutenção não encontrada"));

    if (record.getStatus() != MaintenanceStatus.REQUESTED) {
      throw new ValidationException("Manutenção não pode ser iniciada neste estado");
    }

    record.start(loggedUserContext.getUserId());

    Asset asset = record.getAsset();

    asset.setStatus(AssetStatus.IN_MAINTENANCE);

    auditService.registerEvent(
        AuditEventType.ASSET_STATUS_CHANGED,
        loggedUserContext.getUserId(),
        asset.getOrganization().getId(),
        asset.getUnit().getId(),
        asset.getId(),
        "Manutenção iniciada");

    return record;
  }

  @Transactional
  public MaintenanceRecord complete(Long maintenanceId, String resolution) {

    MaintenanceRecord record =
        maintenanceRepository
            .findById(maintenanceId)
            .orElseThrow(() -> new NotFoundException("Manutenção não encontrada"));

    if (record.getStatus() != MaintenanceStatus.IN_PROGRESS) {
      throw new ValidationException("Manutenção não pode ser concluída neste estado");
    }

    record.complete(loggedUserContext.getUserId(), resolution);

    Asset asset = record.getAsset();

    if (asset.getAssignedUser() != null) {
      asset.setStatus(AssetStatus.ASSIGNED);
    } else {
      asset.setStatus(AssetStatus.AVAILABLE);
    }

    auditService.registerEvent(
        AuditEventType.ASSET_STATUS_CHANGED,
        loggedUserContext.getUserId(),
        asset.getOrganization().getId(),
        asset.getUnit().getId(),
        asset.getId(),
        "Manutenção concluída");

    return record;
  }

  @Transactional
  public MaintenanceRecord cancel(Long maintenanceId) {

    MaintenanceRecord record =
        maintenanceRepository
            .findById(maintenanceId)
            .orElseThrow(() -> new NotFoundException("Manutenção não encontrada"));

    record.cancel();

    Asset asset = record.getAsset();

    if (asset.getAssignedUser() != null) {
      asset.setStatus(AssetStatus.ASSIGNED);
    } else {
      asset.setStatus(AssetStatus.AVAILABLE);
    }

    auditService.registerEvent(
        AuditEventType.ASSET_STATUS_CHANGED,
        loggedUserContext.getUserId(),
        asset.getOrganization().getId(),
        asset.getUnit().getId(),
        asset.getId(),
        "Manutenção cancelada");

    return record;
  }
}
