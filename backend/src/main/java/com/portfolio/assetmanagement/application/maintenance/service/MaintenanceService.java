package com.portfolio.assetmanagement.application.maintenance.service;

import com.portfolio.assetmanagement.application.audit.service.AuditService;
import com.portfolio.assetmanagement.domain.asset.entity.Asset;
import com.portfolio.assetmanagement.domain.asset.enums.AssetStatus;
import com.portfolio.assetmanagement.domain.audit.enums.AuditEventType;
import com.portfolio.assetmanagement.domain.maintenance.entity.MaintenanceRecord;
import com.portfolio.assetmanagement.infrastructure.persistence.asset.repository.AssetRepository;
import com.portfolio.assetmanagement.infrastructure.persistence.maintenance.repository.MaintenanceRepository;
import com.portfolio.assetmanagement.security.context.LoggedUserContext;
import com.portfolio.assetmanagement.shared.exception.NotFoundException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

  @Transactional
  public MaintenanceRecord create(Long assetId, String description) {
    Asset asset =
        assetRepository
            .findById(assetId)
            .orElseThrow(() -> new NotFoundException("Ativo não encontrado"));

    lockService.lockAssetForMaintenance(assetId);
    validationService.validateCreate(asset, description);

    MaintenanceRecord record =
        new MaintenanceRecord(
            asset,
            asset.getOrganization().getId(),
            asset.getUnit().getId(),
            loggedUser.getUserId(),
            description);

    asset.changeStatus(AssetStatus.IN_MAINTENANCE);

    MaintenanceRecord saved = maintenanceRepository.save(record);

    auditService.registerEvent(
        AuditEventType.ASSET_STATUS_CHANGED,
        loggedUser.getUserId(),
        asset.getOrganization().getId(),
        asset.getUnit().getId(),
        asset.getId(),
        "Manutenção solicitada — ativo bloqueado");

    return saved;
  }

  @Transactional
  public MaintenanceRecord start(Long maintenanceId) {
    lockService.lockMaintenance(maintenanceId);
    MaintenanceRecord record =
        maintenanceRepository
            .findById(maintenanceId)
            .orElseThrow(() -> new NotFoundException("Manutenção não encontrada"));
    validationService.validateStart(record);
    record.start(loggedUser.getUserId());
    record.getAsset().changeStatus(AssetStatus.IN_MAINTENANCE);
    auditService.registerEvent(
        AuditEventType.ASSET_STATUS_CHANGED,
        loggedUser.getUserId(),
        record.getAsset().getOrganization().getId(),
        record.getAsset().getUnit().getId(),
        record.getAsset().getId(),
        "Manutenção iniciada");
    return record;
  }

  /** actualCost é opcional — pode ser null. */
  @Transactional
  public MaintenanceRecord complete(Long maintenanceId, String resolution, BigDecimal actualCost) {
    lockService.lockMaintenance(maintenanceId);
    MaintenanceRecord record =
        maintenanceRepository
            .findById(maintenanceId)
            .orElseThrow(() -> new NotFoundException("Manutenção não encontrada"));
    validationService.validateComplete(record, resolution);
    record.complete(loggedUser.getUserId(), resolution, actualCost);
    Asset asset = record.getAsset();
    asset.changeStatus(
        asset.getAssignedUser() != null ? AssetStatus.ASSIGNED : AssetStatus.AVAILABLE);
    auditService.registerEvent(
        AuditEventType.ASSET_STATUS_CHANGED,
        loggedUser.getUserId(),
        asset.getOrganization().getId(),
        asset.getUnit().getId(),
        asset.getId(),
        "Manutenção concluída");
    return record;
  }

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
    asset.changeStatus(
        asset.getAssignedUser() != null ? AssetStatus.ASSIGNED : AssetStatus.AVAILABLE);
    auditService.registerEvent(
        AuditEventType.ASSET_STATUS_CHANGED,
        loggedUser.getUserId(),
        asset.getOrganization().getId(),
        asset.getUnit().getId(),
        asset.getId(),
        "Manutenção cancelada");
    return record;
  }

  @Transactional(readOnly = true)
  public List<MaintenanceRecord> findByAsset(Long assetId) {
    return maintenanceRepository.findByAssetIdOrderByCreatedAtDesc(assetId);
  }

  @Transactional(readOnly = true)
  public List<MaintenanceRecord> findByOrganization() {
    return maintenanceRepository.findByOrganizationIdOrderByCreatedAtDesc(
        loggedUser.getOrganizationId());
  }

  /** Exportação CSV — retorna manutenções do período (ou todas se sem período). */
  @Transactional(readOnly = true)
  public List<MaintenanceRecord> findForExport(LocalDate startDate, LocalDate endDate) {
    Long orgId = loggedUser.getOrganizationId();
    if (startDate == null && endDate == null) {
      return maintenanceRepository.findByOrganizationIdOrderByCreatedAtDesc(orgId);
    }
    OffsetDateTime start =
        startDate != null
            ? startDate.atStartOfDay().atOffset(ZoneOffset.UTC)
            : OffsetDateTime.now().minusMonths(1);
    OffsetDateTime end =
        endDate != null
            ? endDate.plusDays(1).atStartOfDay().atOffset(ZoneOffset.UTC)
            : OffsetDateTime.now();
    return maintenanceRepository.findByOrganizationIdAndCreatedAtBetween(orgId, start, end);
  }
}
