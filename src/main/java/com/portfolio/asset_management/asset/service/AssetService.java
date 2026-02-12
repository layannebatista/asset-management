package com.portfolio.asset_management.asset.service;

import com.portfolio.asset_management.asset.entity.Asset;
import com.portfolio.asset_management.asset.enums.AssetStatus;
import com.portfolio.asset_management.asset.repository.AssetRepository;
import com.portfolio.asset_management.organization.entity.Organization;
import com.portfolio.asset_management.security.context.LoggedUserContext;
import com.portfolio.asset_management.shared.exception.BusinessException;
import com.portfolio.asset_management.shared.exception.ForbiddenException;
import com.portfolio.asset_management.shared.exception.NotFoundException;
import com.portfolio.asset_management.unit.entity.Unit;
import com.portfolio.asset_management.user.entity.User;
import com.portfolio.asset_management.user.repository.UserRepository;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AssetService {

  private final AssetRepository repository;
  private final LoggedUserContext loggedUser;
  private final AssetAssignmentHistoryService assignmentHistoryService;
  private final UserRepository userRepository;

  public AssetService(
      AssetRepository repository,
      LoggedUserContext loggedUser,
      AssetAssignmentHistoryService assignmentHistoryService,
      UserRepository userRepository) {

    this.repository = repository;
    this.loggedUser = loggedUser;
    this.assignmentHistoryService = assignmentHistoryService;
    this.userRepository = userRepository;
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
      String assetTag,
      com.portfolio.asset_management.asset.enums.AssetType type,
      String model,
      Organization organization,
      Unit unit) {

    validateAssetTagUniqueness(assetTag);

    Asset asset = new Asset(assetTag, type, model, organization, unit);

    return repository.save(asset);
  }

  @Transactional
  public void retireAsset(Long id) {

    Asset asset = findById(id);

    asset.setStatus(AssetStatus.RETIRED);
  }

  @Transactional
  public void assignAsset(Long assetId, Long userId) {

    Asset asset = findById(assetId);

    User user =
        userRepository
            .findById(userId)
            .orElseThrow(() -> new NotFoundException("Usuário não encontrado"));

    Long previousUserId = asset.getAssignedUser() != null ? asset.getAssignedUser().getId() : null;

    asset.assignToUser(user);

    assignmentHistoryService.registerAssignmentChange(asset, previousUserId, userId);
  }

  @Transactional
  public void unassignAsset(Long assetId) {

    Asset asset = findById(assetId);

    Long previousUserId = asset.getAssignedUser() != null ? asset.getAssignedUser().getId() : null;

    asset.unassignUser();

    assignmentHistoryService.registerAssignmentChange(asset, previousUserId, null);
  }

  private void validateAssetTagUniqueness(String assetTag) {

    Optional<Asset> existing = repository.findByAssetTag(assetTag);

    if (existing.isPresent()) {
      throw new BusinessException("Já existe um ativo com este assetTag");
    }
  }
}
