package com.portfolio.asset_management.asset.service;

import com.portfolio.asset_management.asset.entity.Asset;
import com.portfolio.asset_management.asset.enums.AssetStatus;
import com.portfolio.asset_management.asset.enums.AssetType;
import com.portfolio.asset_management.asset.repository.AssetRepository;
import com.portfolio.asset_management.audit.enums.AuditEventType;
import com.portfolio.asset_management.audit.service.AuditService;
import com.portfolio.asset_management.organization.entity.Organization;
import com.portfolio.asset_management.security.context.LoggedUserContext;
import com.portfolio.asset_management.shared.exception.BusinessException;
import com.portfolio.asset_management.shared.exception.NotFoundException;
import com.portfolio.asset_management.unit.entity.Unit;
import com.portfolio.asset_management.user.entity.User;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AssetService {

  private final AssetRepository assetRepository;
  private final AuditService auditService;
  private final AssetStatusHistoryService historyService;
  private final LoggedUserContext loggedUser;

  public AssetService(
      AssetRepository assetRepository,
      AuditService auditService,
      AssetStatusHistoryService historyService,
      LoggedUserContext loggedUser) {

    this.assetRepository = assetRepository;
    this.auditService = auditService;
    this.historyService = historyService;
    this.loggedUser = loggedUser;
  }

  // =========================================================
  // ABAC
  // =========================================================

  public List<Asset> findVisibleAssets() {

    if (loggedUser.isAdmin()) {
      return assetRepository.findByOrganization_Id(loggedUser.getOrganizationId());
    }

    if (loggedUser.isManager()) {
      return assetRepository.findByUnit_Id(loggedUser.getUnitId());
    }

    return assetRepository.findByAssignedUser_Id(loggedUser.getUserId());
  }

  public Asset findById(Long assetId) {

    Asset asset =
        assetRepository
            .findById(assetId)
            .orElseThrow(() -> new NotFoundException("Ativo não encontrado"));

    if (loggedUser.isAdmin()) return asset;

    if (loggedUser.isManager() && asset.getUnit().getId().equals(loggedUser.getUnitId())) {
      return asset;
    }

    if (loggedUser.isOperator()
        && asset.getAssignedUser() != null
        && asset.getAssignedUser().getId().equals(loggedUser.getUserId())) {
      return asset;
    }

    throw new BusinessException("Acesso negado ao ativo");
  }

  // =========================================================
  // CREATE
  // =========================================================

  @Transactional
  public Asset createAsset(
      String assetTag, AssetType type, String model, Organization organization, Unit unit) {

    validateAssetTagUniqueness(assetTag);

    Asset asset = new Asset(assetTag, type, model, organization, unit);

    Asset saved = assetRepository.save(asset);

    historyService.registerStatusChange(saved, null, saved.getStatus());

    auditService.registerEvent(
        AuditEventType.ASSET_CREATED,
        loggedUser.getUserId(),
        organization.getId(),
        unit.getId(),
        saved.getId(),
        "Asset created");

    return saved;
  }

  // =========================================================
  // ASSIGN
  // =========================================================

  @Transactional
  public void assignAssetToUser(Long assetId, User user) {

    Asset asset = findById(assetId);

    if (asset.getStatus() != AssetStatus.AVAILABLE) {
      throw new BusinessException("Ativo não disponível");
    }

    AssetStatus previous = asset.getStatus();

    asset.assignToUser(user);

    historyService.registerStatusChange(asset, previous, asset.getStatus());

    auditService.registerEvent(
        AuditEventType.ASSET_ASSIGNED,
        loggedUser.getUserId(),
        asset.getOrganization().getId(),
        asset.getUnit().getId(),
        asset.getId(),
        "Asset assigned");
  }

  // =========================================================
  // UNASSIGN
  // =========================================================

  @Transactional
  public void unassignAssetFromUser(Long assetId) {

    Asset asset = findById(assetId);

    if (asset.getStatus() != AssetStatus.ASSIGNED) {
      throw new BusinessException("Ativo não está atribuído");
    }

    AssetStatus previous = asset.getStatus();

    asset.unassignUser();

    historyService.registerStatusChange(asset, previous, asset.getStatus());

    auditService.registerEvent(
        AuditEventType.ASSET_UNASSIGNED,
        loggedUser.getUserId(),
        asset.getOrganization().getId(),
        asset.getUnit().getId(),
        asset.getId(),
        "Asset unassigned");
  }

  // =========================================================
  // TRANSFER
  // =========================================================

  @Transactional
  public void changeAssetUnit(Long assetId, Unit newUnit) {

    Asset asset = findById(assetId);

    AssetStatus previous = asset.getStatus();

    asset.changeUnit(newUnit);
    asset.setStatus(AssetStatus.IN_TRANSFER);

    historyService.registerStatusChange(asset, previous, asset.getStatus());

    auditService.registerEvent(
        AuditEventType.ASSET_TRANSFERRED,
        loggedUser.getUserId(),
        asset.getOrganization().getId(),
        newUnit.getId(),
        asset.getId(),
        "Asset transferred");
  }

  // =========================================================
  // RETIRE
  // =========================================================

  @Transactional
  public void retireAsset(Long assetId) {

    Asset asset = findById(assetId);

    AssetStatus previous = asset.getStatus();

    asset.setStatus(AssetStatus.RETIRED);
    asset.unassignUser();

    historyService.registerStatusChange(asset, previous, asset.getStatus());

    auditService.registerEvent(
        AuditEventType.ASSET_RETIRED,
        loggedUser.getUserId(),
        asset.getOrganization().getId(),
        asset.getUnit().getId(),
        asset.getId(),
        "Asset retired");
  }

  // =========================================================
  // VALIDATION
  // =========================================================

  private void validateAssetTagUniqueness(String assetTag) {

    Optional<Asset> existing = assetRepository.findByAssetTag(assetTag);

    if (existing.isPresent()) {
      throw new BusinessException("Já existe um ativo com este identificador");
    }
  }
}
