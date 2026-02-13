package com.portfolio.asset_management.maintenance.service;

import com.portfolio.asset_management.asset.entity.Asset;
import com.portfolio.asset_management.asset.enums.AssetStatus;
import com.portfolio.asset_management.asset.repository.AssetRepository;
import com.portfolio.asset_management.audit.enums.AuditEventType;
import com.portfolio.asset_management.audit.service.AuditService;
import com.portfolio.asset_management.maintenance.entity.MaintenanceRecord;
import com.portfolio.asset_management.maintenance.repository.MaintenanceRepository;
import com.portfolio.asset_management.security.context.LoggedUserContext;
import com.portfolio.asset_management.shared.exception.NotFoundException;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service responsável pelo lifecycle completo de Maintenance.
 *
 * <p>Integrado com:
 *
 * <p>- ValidationService - LockService - AuditService
 *
 * <p>Garantias:
 *
 * <p>- integridade de estado - concorrência segura - isolamento multi-tenant
 */
@Service
public class MaintenanceService {

  private final MaintenanceRepository maintenanceRepository;

  private final AssetRepository assetRepository;

  private final AuditService auditService;

  private final LoggedUserContext loggedUser;

  private final MaintenanceValidationService validationService;

  private final MaintenanceLockService lockService;

  public MaintenanceService(
      MaintenanceRepository maintenanceRepository,
      AssetRepository assetRepository,
      AuditService auditService,
      LoggedUserContext loggedUser,
      MaintenanceValidationService validationService,
      MaintenanceLockService lockService) {

    this.maintenanceRepository = maintenanceRepository;
    this.assetRepository = assetRepository;
    this.auditService = auditService;
    this.loggedUser = loggedUser;
    this.validationService = validationService;
    this.lockService = lockService;
  }

  /** Cria manutenção. */
  @Transactional
  public MaintenanceRecord create(Long assetId, String description) {

    Asset asset =
        assetRepository
            .findById(assetId)
            .orElseThrow(() -> new NotFoundException("Ativo não encontrado"));

    // lock concorrência
    lockService.lockAssetForMaintenance(assetId);

    // validação enterprise
    validationService.validateCreate(asset, description);

    MaintenanceRecord record =
        new MaintenanceRecord(
            asset,
            asset.getOrganization().getId(),
            asset.getUnit().getId(),
            loggedUser.getUserId(),
            description);

    MaintenanceRecord saved = maintenanceRepository.save(record);

    auditService.registerEvent(
        AuditEventType.ASSET_STATUS_CHANGED,
        loggedUser.getUserId(),
        asset.getOrganization().getId(),
        asset.getUnit().getId(),
        asset.getId(),
        "Manutenção solicitada");

    return saved;
  }

  /** Inicia manutenção. */
  @Transactional
  public MaintenanceRecord start(Long maintenanceId) {

    lockService.lockMaintenance(maintenanceId);

    MaintenanceRecord record =
        maintenanceRepository
            .findById(maintenanceId)
            .orElseThrow(() -> new NotFoundException("Manutenção não encontrada"));

    validationService.validateStart(record);

    record.start(loggedUser.getUserId());

    Asset asset = record.getAsset();

    asset.changeStatus(AssetStatus.IN_MAINTENANCE);

    auditService.registerEvent(
        AuditEventType.ASSET_STATUS_CHANGED,
        loggedUser.getUserId(),
        asset.getOrganization().getId(),
        asset.getUnit().getId(),
        asset.getId(),
        "Manutenção iniciada");

    return record;
  }

  /** Conclui manutenção. */
  @Transactional
  public MaintenanceRecord complete(Long maintenanceId, String resolution) {

    lockService.lockMaintenance(maintenanceId);

    MaintenanceRecord record =
        maintenanceRepository
            .findById(maintenanceId)
            .orElseThrow(() -> new NotFoundException("Manutenção não encontrada"));

    validationService.validateComplete(record, resolution);

    record.complete(loggedUser.getUserId(), resolution);

    Asset asset = record.getAsset();

    if (asset.getAssignedUser() != null) {

      asset.changeStatus(AssetStatus.ASSIGNED);

    } else {

      asset.changeStatus(AssetStatus.AVAILABLE);
    }

    auditService.registerEvent(
        AuditEventType.ASSET_STATUS_CHANGED,
        loggedUser.getUserId(),
        asset.getOrganization().getId(),
        asset.getUnit().getId(),
        asset.getId(),
        "Manutenção concluída");

    return record;
  }

  /** Cancela manutenção. */
  @Transactional
  public MaintenanceRecord cancel(Long maintenanceId) {

    lockService.lockMaintenance(maintenanceId);

    MaintenanceRecord record =
        maintenanceRepository
            .findById(maintenanceId)
            .orElseThrow(() -> new NotFoundException("Manutenção não encontrada"));

    validationService.validateCancel(record);

    record.cancel();

    Asset asset = record.getAsset();

    if (asset.getAssignedUser() != null) {

      asset.changeStatus(AssetStatus.ASSIGNED);

    } else {

      asset.changeStatus(AssetStatus.AVAILABLE);
    }

    auditService.registerEvent(
        AuditEventType.ASSET_STATUS_CHANGED,
        loggedUser.getUserId(),
        asset.getOrganization().getId(),
        asset.getUnit().getId(),
        asset.getId(),
        "Manutenção cancelada");

    return record;
  }

  /** Lista histórico por asset. */
  public List<MaintenanceRecord> findByAsset(Long assetId) {

    return maintenanceRepository.findByAssetIdOrderByCreatedAtDesc(assetId);
  }

  /** Lista histórico da organização. */
  public List<MaintenanceRecord> findByOrganization() {

    return maintenanceRepository.findByOrganizationIdOrderByCreatedAtDesc(
        loggedUser.getOrganizationId());
  }
}
