package com.portfolio.assetmanagement.application.maintenance.service;

import com.portfolio.assetmanagement.application.audit.service.AuditService;
import com.portfolio.assetmanagement.domain.asset.entity.Asset;
import com.portfolio.assetmanagement.domain.asset.enums.AssetStatus;
import com.portfolio.assetmanagement.domain.audit.enums.AuditEventType;
import com.portfolio.assetmanagement.domain.maintenance.entity.MaintenanceRecord;
import com.portfolio.assetmanagement.infrastructure.persistence.asset.repository.AssetRepository;
import com.portfolio.assetmanagement.infrastructure.persistence.maintenance.repository.MaintenanceRepository;
import com.portfolio.assetmanagement.security.context.LoggedUserContext;
import com.portfolio.assetmanagement.shared.exception.ForbiddenException;
import com.portfolio.assetmanagement.shared.exception.NotFoundException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.stream.Collectors;
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

  // ─────────────────────────────────────────────
  // 🔒 VALIDAÇÃO DE ESCOPO
  // ─────────────────────────────────────────────
  private Asset validateAssetAccess(Long assetId) {
    Asset asset =
        assetRepository
            .findById(assetId)
            .orElseThrow(() -> new NotFoundException("Ativo não encontrado"));

    if (loggedUser.isAdmin()) return asset;

    if (loggedUser.isManager()) {
      if (asset.getUnit() == null || !asset.getUnit().getId().equals(loggedUser.getUnitId())) {
        throw new ForbiddenException("Acesso negado ao ativo");
      }
      return asset;
    }

    if (asset.getAssignedUser() == null
        || !asset.getAssignedUser().getId().equals(loggedUser.getUserId())) {
      throw new ForbiddenException("Acesso negado ao ativo");
    }

    return asset;
  }

  private MaintenanceRecord validateMaintenanceAccess(Long maintenanceId) {
    MaintenanceRecord record =
        maintenanceRepository
            .findById(maintenanceId)
            .orElseThrow(() -> new NotFoundException("Manutenção não encontrada"));

    Asset asset = record.getAsset();

    if (loggedUser.isAdmin()) return record;

    if (loggedUser.isManager()) {
      if (asset.getUnit() == null || !asset.getUnit().getId().equals(loggedUser.getUnitId())) {
        throw new ForbiddenException("Acesso negado à manutenção");
      }
      return record;
    }

    if (asset.getAssignedUser() == null
        || !asset.getAssignedUser().getId().equals(loggedUser.getUserId())) {
      throw new ForbiddenException("Acesso negado à manutenção");
    }

    return record;
  }

  @Transactional
  public MaintenanceRecord create(Long assetId, String description, BigDecimal estimatedCost) {

    Asset asset = validateAssetAccess(assetId); // 🔥 CORREÇÃO

    lockService.lockAssetForMaintenance(assetId);
    validationService.validateCreate(asset, description);

    MaintenanceRecord record =
        new MaintenanceRecord(
            asset,
            asset.getOrganization().getId(),
            asset.getUnit().getId(),
            loggedUser.getUserId(),
            description);

    if (estimatedCost != null) {
      record.setEstimatedCost(estimatedCost);
    }

    asset.changeStatus(AssetStatus.IN_MAINTENANCE);

    MaintenanceRecord saved = maintenanceRepository.save(record);

    auditService.registerEvent(
        AuditEventType.MAINTENANCE_OPENED,
        loggedUser.getUserId(),
        asset.getOrganization().getId(),
        asset.getUnit().getId(),
        saved.getId(),
        "Manutenção aberta");

    return saved;
  }

  @Transactional
  public MaintenanceRecord create(Long assetId, String description) {
    return create(assetId, description, null);
  }

  @Transactional
  public MaintenanceRecord start(Long maintenanceId) {

    lockService.lockMaintenance(maintenanceId);

    MaintenanceRecord record = validateMaintenanceAccess(maintenanceId); // 🔥 CORREÇÃO

    validationService.validateStart(record);

    record.start(loggedUser.getUserId());

    record.getAsset().changeStatus(AssetStatus.IN_MAINTENANCE);

    auditService.registerEvent(
        AuditEventType.MAINTENANCE_STARTED,
        loggedUser.getUserId(),
        record.getAsset().getOrganization().getId(),
        record.getAsset().getUnit().getId(),
        record.getId(),
        "Manutenção iniciada");

    return record;
  }

  @Transactional
  public MaintenanceRecord complete(Long maintenanceId, String resolution, BigDecimal actualCost) {

    lockService.lockMaintenance(maintenanceId);

    MaintenanceRecord record = validateMaintenanceAccess(maintenanceId); // 🔥 CORREÇÃO

    validationService.validateComplete(record, resolution);

    record.complete(loggedUser.getUserId(), resolution, actualCost);

    Asset asset = record.getAsset();

    asset.changeStatus(
        asset.getAssignedUser() != null ? AssetStatus.ASSIGNED : AssetStatus.AVAILABLE);

    auditService.registerEvent(
        AuditEventType.MAINTENANCE_COMPLETED,
        loggedUser.getUserId(),
        asset.getOrganization().getId(),
        asset.getUnit().getId(),
        record.getId(),
        "Manutenção concluída");

    return record;
  }

  @Transactional
  public MaintenanceRecord cancel(Long maintenanceId) {

    lockService.lockMaintenance(maintenanceId);

    MaintenanceRecord record = validateMaintenanceAccess(maintenanceId); // 🔥 CORREÇÃO

    validationService.validateCancel(record);

    record.cancel();

    Asset asset = record.getAsset();

    asset.changeStatus(
        asset.getAssignedUser() != null ? AssetStatus.ASSIGNED : AssetStatus.AVAILABLE);

    auditService.registerEvent(
        AuditEventType.MAINTENANCE_CANCELLED,
        loggedUser.getUserId(),
        asset.getOrganization().getId(),
        asset.getUnit().getId(),
        record.getId(),
        "Manutenção cancelada");

    return record;
  }

  @Transactional(readOnly = true)
  public List<MaintenanceRecord> findByAsset(Long assetId) {
    validateAssetAccess(assetId); // 🔥 CORREÇÃO
    return maintenanceRepository.findByAssetIdOrderByCreatedAtDesc(assetId);
  }

  @Transactional(readOnly = true)
  public List<MaintenanceRecord> findByOrganization() {

    List<MaintenanceRecord> all =
        maintenanceRepository.findByOrganizationIdOrderByCreatedAtDesc(
            loggedUser.getOrganizationId());

    if (loggedUser.isAdmin()) return all;

    if (loggedUser.isManager()) {
      return all.stream()
          .filter(
              r ->
                  r.getAsset().getUnit() != null
                      && r.getAsset().getUnit().getId().equals(loggedUser.getUnitId()))
          .collect(Collectors.toList());
    }

    return all.stream()
        .filter(
            r ->
                r.getAsset().getAssignedUser() != null
                    && r.getAsset().getAssignedUser().getId().equals(loggedUser.getUserId()))
        .collect(Collectors.toList());
  }

  @Transactional(readOnly = true)
  public List<MaintenanceRecord> findForExport(LocalDate startDate, LocalDate endDate) {

    Long orgId = loggedUser.getOrganizationId();

    List<MaintenanceRecord> records;

    if (startDate == null && endDate == null) {
      records = maintenanceRepository.findByOrganizationIdOrderByCreatedAtDesc(orgId);
    } else {
      OffsetDateTime start =
          startDate != null
              ? startDate.atStartOfDay().atOffset(ZoneOffset.UTC)
              : OffsetDateTime.now().minusMonths(1);

      OffsetDateTime end =
          endDate != null
              ? endDate.plusDays(1).atStartOfDay().atOffset(ZoneOffset.UTC)
              : OffsetDateTime.now();

      records = maintenanceRepository.findByOrganizationIdAndCreatedAtBetween(orgId, start, end);
    }

    if (loggedUser.isAdmin()) return records;

    if (loggedUser.isManager()) {
      return records.stream()
          .filter(
              r ->
                  r.getAsset().getUnit() != null
                      && r.getAsset().getUnit().getId().equals(loggedUser.getUnitId()))
          .collect(Collectors.toList());
    }

    return records.stream()
        .filter(
            r ->
                r.getAsset().getAssignedUser() != null
                    && r.getAsset().getAssignedUser().getId().equals(loggedUser.getUserId()))
        .collect(Collectors.toList());
  }
}
