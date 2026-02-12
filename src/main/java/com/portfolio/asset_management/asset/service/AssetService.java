package com.portfolio.asset_management.asset.service;

import com.portfolio.asset_management.asset.entity.Asset;
import com.portfolio.asset_management.asset.enums.AssetStatus;
import com.portfolio.asset_management.asset.enums.AssetType;
import com.portfolio.asset_management.asset.repository.AssetRepository;
import com.portfolio.asset_management.organization.entity.Organization;
import com.portfolio.asset_management.security.context.LoggedUserContext;
import com.portfolio.asset_management.shared.exception.BusinessException;
import com.portfolio.asset_management.shared.exception.ForbiddenException;
import com.portfolio.asset_management.shared.exception.NotFoundException;
import com.portfolio.asset_management.unit.entity.Unit;
import jakarta.transaction.Transactional;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class AssetService {

  private final AssetRepository repository;
  private final LoggedUserContext loggedUser;

  public AssetService(AssetRepository repository, LoggedUserContext loggedUser) {
    this.repository = repository;
    this.loggedUser = loggedUser;
  }

  /** Retorna ativos visíveis conforme role do usuário. */
  public List<Asset> findVisibleAssets() {

    if (loggedUser.isAdmin()) {
      return repository.findByOrganization_Id(loggedUser.getOrganizationId());
    }

    if (loggedUser.isManager()) {
      return repository.findByUnit_Id(loggedUser.getUnitId());
    }

    return repository.findByAssignedUser_Id(loggedUser.getUserId());
  }

  /** Busca ativo por ID com validação de acesso. */
  public Asset findById(Long id) {

    Asset asset =
        repository.findById(id).orElseThrow(() -> new NotFoundException("Ativo não encontrado"));

    validateAccess(asset);

    return asset;
  }

  /** Cria novo ativo. */
  @Transactional
  public Asset createAsset(
      String assetTag, AssetType type, String model, Organization organization, Unit unit) {

    validateAssetTagUniqueness(assetTag);

    if (!organization.getId().equals(loggedUser.getOrganizationId())) {
      throw new ForbiddenException("Não é permitido criar ativo em outra organização");
    }

    Asset asset = new Asset(assetTag, type, model, organization, unit);

    return repository.save(asset);
  }

  /** Aposenta ativo. */
  @Transactional
  public void retireAsset(Long id) {

    Asset asset = findById(id);

    if (asset.getStatus() == AssetStatus.RETIRED) {
      throw new BusinessException("Ativo já está aposentado");
    }

    asset.setStatus(AssetStatus.RETIRED);
  }

  /** Valida acesso ao ativo. */
  private void validateAccess(Asset asset) {

    if (loggedUser.isAdmin()) return;

    if (loggedUser.isManager() && asset.getUnit().getId().equals(loggedUser.getUnitId())) {
      return;
    }

    if (asset.getAssignedUser() != null
        && asset.getAssignedUser().getId().equals(loggedUser.getUserId())) {
      return;
    }

    throw new ForbiddenException("Você não tem acesso a este ativo");
  }

  /** Garante unicidade do assetTag. */
  private void validateAssetTagUniqueness(String assetTag) {

    if (repository.findByAssetTag(assetTag).isPresent()) {
      throw new BusinessException("Já existe um ativo com este assetTag");
    }
  }
}
