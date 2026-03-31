package com.portfolio.assetmanagement.application.asset.service;

import com.portfolio.assetmanagement.application.asset.dto.AssetResponseDTO;
import com.portfolio.assetmanagement.application.asset.mapper.AssetMapper;
import com.portfolio.assetmanagement.application.audit.service.AuditService;
import com.portfolio.assetmanagement.domain.asset.entity.Asset;
import com.portfolio.assetmanagement.domain.asset.enums.AssetStatus;
import com.portfolio.assetmanagement.domain.asset.enums.AssetType;
import com.portfolio.assetmanagement.domain.audit.enums.AuditEventType;
import com.portfolio.assetmanagement.domain.organization.entity.Organization;
import com.portfolio.assetmanagement.domain.unit.entity.Unit;
import com.portfolio.assetmanagement.domain.user.entity.User;
import com.portfolio.assetmanagement.infrastructure.persistence.asset.repository.AssetRepository;
import com.portfolio.assetmanagement.infrastructure.persistence.user.repository.UserRepository;
import com.portfolio.assetmanagement.security.context.LoggedUserContext;
import com.portfolio.assetmanagement.shared.exception.BusinessException;
import com.portfolio.assetmanagement.shared.exception.ForbiddenException;
import com.portfolio.assetmanagement.shared.exception.NotFoundException;
import com.portfolio.assetmanagement.shared.pagination.PageResponse;
import com.portfolio.assetmanagement.shared.specification.AssetSpecificationBuilder;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AssetService {

  private final AssetRepository repository;
  private final LoggedUserContext loggedUser;
  private final AssetAssignmentHistoryService assignmentHistoryService;
  private final UserRepository userRepository;
  private final AssetValidationService validationService;
  private final AssetStatusService statusService;
  private final AssetNumberGeneratorService numberGeneratorService;
  private final AssetMapper assetMapper;
  private final AuditService auditService;

  public AssetService(
      AssetRepository repository,
      LoggedUserContext loggedUser,
      AssetAssignmentHistoryService assignmentHistoryService,
      UserRepository userRepository,
      AssetValidationService validationService,
      AssetStatusService statusService,
      AssetNumberGeneratorService numberGeneratorService,
      AssetMapper assetMapper,
      AuditService auditService) {
    this.repository = repository;
    this.loggedUser = loggedUser;
    this.assignmentHistoryService = assignmentHistoryService;
    this.userRepository = userRepository;
    this.validationService = validationService;
    this.statusService = statusService;
    this.numberGeneratorService = numberGeneratorService;
    this.assetMapper = assetMapper;
    this.auditService = auditService;
  }

  public Asset findById(Long id) {
    Asset asset =
        repository.findById(id).orElseThrow(() -> new NotFoundException("Ativo não encontrado"));
    validateAccess(asset);
    return asset;
  }

  private void validateAccess(Asset asset) {
    if (loggedUser.isAdmin()) return;

    if (loggedUser.isManager()) {
      if (asset.getUnit() == null || !asset.getUnit().getId().equals(loggedUser.getUnitId())) {
        throw new ForbiddenException("Access denied");
      }
      return;
    }

    // OPERADOR
    if (asset.getAssignedUser() == null
        || !asset.getAssignedUser().getId().equals(loggedUser.getUserId())) {
      throw new ForbiddenException("Access denied");
    }
  }

  private void validateUnitOwnership(Unit unit) {
    if (loggedUser.isAdmin()) return;
    if (loggedUser.isManager()) {
      if (unit == null || !unit.getId().equals(loggedUser.getUnitId())) {
        throw new ForbiddenException(
            "Gestor não pode cadastrar ativos em unidades que não são suas");
      }
    }
  }

  @Transactional(readOnly = true)
  public PageResponse<AssetResponseDTO> searchAssets(
      AssetStatus status,
      AssetType type,
      Long unitId,
      Long assignedUserId,
      String assetTag,
      String model,
      String search,
      Pageable pageable) {

    AssetSpecificationBuilder builder = new AssetSpecificationBuilder();

    builder
        .with("status", status)
        .with("type", type)
        .with("assetTag", assetTag)
        .with("model", model)
        .withSearch(search);

    // 🔥 CORREÇÃO DE ESCOPO
    if (loggedUser.isAdmin()) {

      builder.with("organizationId", loggedUser.getOrganizationId());

      if (unitId != null) builder.with("unitId", unitId);
      if (assignedUserId != null) builder.with("assignedUserId", assignedUserId);

    } else if (loggedUser.isManager()) {

      builder.with("organizationId", loggedUser.getOrganizationId());
      builder.with("unitId", loggedUser.getUnitId());

      if (assignedUserId != null) builder.with("assignedUserId", assignedUserId);

    } else {

      // OPERADOR → só seus ativos
      builder.with("organizationId", loggedUser.getOrganizationId());
      builder.with("assignedUserId", loggedUser.getUserId());
    }

    Page<Asset> page = repository.findAll(builder.build(), pageable);

    List<AssetResponseDTO> content =
        page.getContent().stream().map(assetMapper::toResponseDTO).collect(Collectors.toList());

    return PageResponse.from(page, content);
  }

  @Transactional
  public Asset createAsset(
      String assetTag, AssetType type, String model, Organization organization, Unit unit) {
    validateUnitOwnership(unit);
    validationService.validateAssetTag(assetTag);
    validationService.validateAssetTagUniqueness(assetTag);
    validationService.validateOrganizationUnitIntegrity(organization, unit);
    Asset asset = repository.save(new Asset(assetTag, type, model, organization, unit));
    auditService.registerEvent(
        AuditEventType.ASSET_CREATED,
        loggedUser.getUserId(),
        organization.getId(),
        unit.getId(),
        asset.getId(),
        "Ativo criado");
    return asset;
  }

  @Transactional
  public Asset createAssetAutoTag(
      AssetType type, String model, Organization organization, Unit unit) {
    validateUnitOwnership(unit);
    validationService.validateOrganizationUnitIntegrity(organization, unit);
    String assetTag = numberGeneratorService.generate();
    try {
      Asset asset = repository.save(new Asset(assetTag, type, model, organization, unit));
      auditService.registerEvent(
          AuditEventType.ASSET_CREATED,
          loggedUser.getUserId(),
          organization.getId(),
          unit.getId(),
          asset.getId(),
          "Ativo criado");
      return asset;
    } catch (DataIntegrityViolationException ex) {
      throw new BusinessException("Nao foi possivel gerar um assetTag unico. Tente novamente.");
    }
  }

  @Transactional
  public void retireAsset(Long id) {
    Asset asset = findById(id);
    statusService.retire(asset);
    auditService.registerEvent(
        AuditEventType.ASSET_RETIRED,
        loggedUser.getUserId(),
        asset.getOrganization().getId(),
        asset.getUnit().getId(),
        asset.getId(),
        "Ativo aposentado");
  }

  @Transactional
  public void assignAsset(Long assetId, Long userId) {
    Asset asset = findById(assetId);
    User user =
        userRepository
            .findById(userId)
            .orElseThrow(() -> new NotFoundException("Usuario nao encontrado"));
    validationService.validateAssignmentIntegrity(asset, user);
    Long previousUserId = asset.getAssignedUser() != null ? asset.getAssignedUser().getId() : null;
    statusService.assign(asset, user);
    assignmentHistoryService.registerAssignmentChange(asset, previousUserId, userId);
    auditService.registerEvent(
        AuditEventType.ASSET_ASSIGNED,
        loggedUser.getUserId(),
        asset.getOrganization().getId(),
        asset.getUnit().getId(),
        asset.getId(),
        "Ativo atribuido ao usuario #" + userId);
  }

  @Transactional
  public void unassignAsset(Long assetId) {
    Asset asset = findById(assetId);
    Long previousUserId = asset.getAssignedUser() != null ? asset.getAssignedUser().getId() : null;
    statusService.unassign(asset);
    assignmentHistoryService.registerAssignmentChange(asset, previousUserId, null);
    auditService.registerEvent(
        AuditEventType.ASSET_UNASSIGNED,
        loggedUser.getUserId(),
        asset.getOrganization().getId(),
        asset.getUnit().getId(),
        asset.getId(),
        "Ativo desatribuido");
  }

  @Transactional(readOnly = true)
  public List<Asset> findAllForExport() {
    return repository.findByOrganization_Id(loggedUser.getOrganizationId());
  }

  @Transactional
  public Asset updateFinancial(
      Long id, com.portfolio.assetmanagement.application.asset.dto.AssetFinancialUpdateDTO dto) {
    Asset asset = findById(id);
    if (dto.getPurchaseValue() != null) asset.setPurchaseValue(dto.getPurchaseValue());
    if (dto.getResidualValue() != null) asset.setResidualValue(dto.getResidualValue());
    if (dto.getUsefulLifeMonths() != null) asset.setUsefulLifeMonths(dto.getUsefulLifeMonths());
    if (dto.getDepreciationMethod() != null)
      asset.setDepreciationMethod(dto.getDepreciationMethod());
    if (dto.getPurchaseDate() != null) asset.setPurchaseDate(dto.getPurchaseDate());
    if (dto.getWarrantyExpiry() != null) asset.setWarrantyExpiry(dto.getWarrantyExpiry());
    if (dto.getSupplier() != null) asset.setSupplier(dto.getSupplier());
    if (dto.getInvoiceNumber() != null) asset.setInvoiceNumber(dto.getInvoiceNumber());
    if (dto.getInvoiceDate() != null) asset.setInvoiceDate(dto.getInvoiceDate());
    return repository.save(asset);
  }
}
