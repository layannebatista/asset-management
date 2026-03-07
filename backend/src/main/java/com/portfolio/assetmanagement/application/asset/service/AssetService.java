package com.portfolio.assetmanagement.application.asset.service;

import com.portfolio.assetmanagement.application.asset.dto.AssetResponseDTO;
import com.portfolio.assetmanagement.application.asset.mapper.AssetMapper;
import com.portfolio.assetmanagement.domain.asset.entity.Asset;
import com.portfolio.assetmanagement.domain.asset.enums.AssetStatus;
import com.portfolio.assetmanagement.domain.asset.enums.AssetType;
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

  public AssetService(
      AssetRepository repository,
      LoggedUserContext loggedUser,
      AssetAssignmentHistoryService assignmentHistoryService,
      UserRepository userRepository,
      AssetValidationService validationService,
      AssetStatusService statusService,
      AssetNumberGeneratorService numberGeneratorService,
      AssetMapper assetMapper) {
    this.repository = repository;
    this.loggedUser = loggedUser;
    this.assignmentHistoryService = assignmentHistoryService;
    this.userRepository = userRepository;
    this.validationService = validationService;
    this.statusService = statusService;
    this.numberGeneratorService = numberGeneratorService;
    this.assetMapper = assetMapper;
  }

  public Asset findById(Long id) {
    Asset asset =
        repository.findById(id).orElseThrow(() -> new NotFoundException("Ativo não encontrado"));
    validateAccess(asset);
    return asset;
  }

  private void validateAccess(Asset asset) {
    if (loggedUser.isAdmin()) return;
    if (!asset.getOrganization().getId().equals(loggedUser.getOrganizationId()))
      throw new ForbiddenException("Access denied");
  }

  @Transactional(readOnly = true)
  public PageResponse<AssetResponseDTO> searchAssets(
      AssetStatus status,
      AssetType type,
      Long unitId,
      Long assignedUserId,
      String assetTag,
      String model,
      Pageable pageable) {

    AssetSpecificationBuilder builder = new AssetSpecificationBuilder();
    builder
        .with("status", status)
        .with("type", type)
        .with("unitId", unitId)
        .with("assignedUserId", assignedUserId)
        .with("assetTag", assetTag)
        .with("model", model);

    if (!loggedUser.isAdmin()) builder.with("organizationId", loggedUser.getOrganizationId());

    Page<Asset> page = repository.findAll(builder.build(), pageable);
    List<AssetResponseDTO> content =
        page.getContent().stream().map(assetMapper::toResponseDTO).collect(Collectors.toList());

    return PageResponse.from(page, content);
  }

  @Transactional
  public Asset createAsset(
      String assetTag, AssetType type, String model, Organization organization, Unit unit) {
    validationService.validateAssetTag(assetTag);
    validationService.validateAssetTagUniqueness(assetTag);
    validationService.validateOrganizationUnitIntegrity(organization, unit);
    return repository.save(new Asset(assetTag, type, model, organization, unit));
  }

  @Transactional
  public Asset createAssetAutoTag(
      AssetType type, String model, Organization organization, Unit unit) {
    validationService.validateOrganizationUnitIntegrity(organization, unit);
    String assetTag = numberGeneratorService.generate();
    try {
      return repository.save(new Asset(assetTag, type, model, organization, unit));
    } catch (DataIntegrityViolationException ex) {
      throw new BusinessException("Não foi possível gerar um assetTag único. Tente novamente.");
    }
  }

  @Transactional
  public void retireAsset(Long id) {
    statusService.retire(findById(id));
  }

  @Transactional
  public void assignAsset(Long assetId, Long userId) {
    Asset asset = findById(assetId);
    User user =
        userRepository
            .findById(userId)
            .orElseThrow(() -> new NotFoundException("Usuário não encontrado"));
    validationService.validateAssignmentIntegrity(asset, user);
    Long previousUserId = asset.getAssignedUser() != null ? asset.getAssignedUser().getId() : null;
    statusService.assign(asset, user);
    assignmentHistoryService.registerAssignmentChange(asset, previousUserId, userId);
  }

  @Transactional
  public void unassignAsset(Long assetId) {
    Asset asset = findById(assetId);
    Long previousUserId = asset.getAssignedUser() != null ? asset.getAssignedUser().getId() : null;
    statusService.unassign(asset);
    assignmentHistoryService.registerAssignmentChange(asset, previousUserId, null);
  }

  /** Exportação CSV — retorna todos os ativos da organização do usuário logado. */
  @Transactional(readOnly = true)
  public List<Asset> findAllForExport() {
    return repository.findByOrganization_Id(loggedUser.getOrganizationId());
  }
}
