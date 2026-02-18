package com.portfolio.assetmanagement.application.asset.service;

import com.portfolio.assetmanagement.domain.asset.entity.Asset;
import com.portfolio.assetmanagement.domain.asset.enums.AssetType;
import com.portfolio.assetmanagement.domain.organization.entity.Organization;
import com.portfolio.assetmanagement.domain.unit.entity.Unit;
import com.portfolio.assetmanagement.domain.user.entity.User;
import com.portfolio.assetmanagement.infrastructure.persistence.asset.repository.AssetRepository;
import com.portfolio.assetmanagement.infrastructure.persistence.user.repository.UserRepository;
import com.portfolio.assetmanagement.security.context.LoggedUserContext;
import com.portfolio.assetmanagement.shared.exception.ForbiddenException;
import com.portfolio.assetmanagement.shared.exception.NotFoundException;
import java.util.List;
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

  public AssetService(
      AssetRepository repository,
      LoggedUserContext loggedUser,
      AssetAssignmentHistoryService assignmentHistoryService,
      UserRepository userRepository,
      AssetValidationService validationService,
      AssetStatusService statusService,
      AssetNumberGeneratorService numberGeneratorService) {

    this.repository = repository;
    this.loggedUser = loggedUser;
    this.assignmentHistoryService = assignmentHistoryService;
    this.userRepository = userRepository;
    this.validationService = validationService;
    this.statusService = statusService;
    this.numberGeneratorService = numberGeneratorService;
  }

  public List<Asset> findVisibleAssets() {

    if (loggedUser.isAdmin()) {

      return repository.findAll();
    }

    return repository.findByOrganization_Id(loggedUser.getOrganizationId());
  }

  public Asset findById(Long id) {

    Asset asset =
        repository.findById(id).orElseThrow(() -> new NotFoundException("Ativo não encontrado"));

    validateAccess(asset);

    return asset;
  }

  private void validateAccess(Asset asset) {

    if (loggedUser.isAdmin()) {
      return;
    }

    if (!asset.getOrganization().getId().equals(loggedUser.getOrganizationId())) {

      throw new ForbiddenException("Access denied");
    }
  }

  @Transactional
  public Asset createAsset(
      String assetTag, AssetType type, String model, Organization organization, Unit unit) {

    validationService.validateAssetTag(assetTag);

    validationService.validateAssetTagUniqueness(assetTag);

    validationService.validateOrganizationUnitIntegrity(organization, unit);

    Asset asset = new Asset(assetTag, type, model, organization, unit);

    return repository.save(asset);
  }

  /** Criação com assetTag automático. */
  @Transactional
  public Asset createAssetAutoTag(
      AssetType type, String model, Organization organization, Unit unit) {

    validationService.validateOrganizationUnitIntegrity(organization, unit);

    String assetTag = numberGeneratorService.generate();

    Asset asset = new Asset(assetTag, type, model, organization, unit);

    return repository.save(asset);
  }

  @Transactional
  public void retireAsset(Long id) {

    Asset asset = findById(id);

    statusService.retire(asset);
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
}
