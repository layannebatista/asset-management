package com.portfolio.asset_management.asset.service;

import com.portfolio.asset_management.asset.entity.Asset;
import com.portfolio.asset_management.asset.enums.AssetStatus;
import com.portfolio.asset_management.asset.enums.AssetType;
import com.portfolio.asset_management.asset.repository.AssetRepository;
import com.portfolio.asset_management.organization.entity.Organization;
import com.portfolio.asset_management.unit.entity.Unit;
import com.portfolio.asset_management.user.entity.User;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service responsável pelas regras de negócio relacionadas aos ativos.
 *
 * <p>Centraliza o cadastro, atribuição, transferência e controle do ciclo de vida dos ativos no
 * sistema.
 */
@Service
public class AssetService {

  private final AssetRepository assetRepository;

  public AssetService(AssetRepository assetRepository) {
    this.assetRepository = assetRepository;
  }

  /**
   * Cria um novo ativo no sistema.
   *
   * <p>O ativo nasce com status AVAILABLE e sem vínculo com usuário.
   */
  @Transactional
  public Asset createAsset(
      String assetTag, AssetType type, String model, Organization organization, Unit unit) {

    validateAssetTagUniqueness(assetTag);

    Asset asset = new Asset(assetTag, type, model, organization, unit);
    return assetRepository.save(asset);
  }

  public Asset findById(Long assetId) {
    return assetRepository
        .findById(assetId)
        .orElseThrow(() -> new RuntimeException("Ativo não encontrado"));
  }

  /** Atribui um ativo a um usuário. */
  @Transactional
  public void assignAssetToUser(Long assetId, User user) {
    Asset asset = findById(assetId);

    if (asset.getStatus() != AssetStatus.AVAILABLE) {
      throw new RuntimeException("Ativo não disponível para atribuição");
    }

    asset.assignToUser(user);
  }

  /** Remove o vínculo do ativo com o usuário. */
  @Transactional
  public void unassignAssetFromUser(Long assetId) {
    Asset asset = findById(assetId);

    if (asset.getStatus() != AssetStatus.ASSIGNED) {
      throw new RuntimeException("Ativo não está atribuído a um usuário");
    }

    asset.unassignUser();
  }

  /**
   * Transfere um ativo para outra unidade.
   *
   * <p>Este método representa apenas a mudança de unidade no domínio. O fluxo completo de
   * transferência será tratado em módulo próprio.
   */
  @Transactional
  public void changeAssetUnit(Long assetId, Unit newUnit) {
    Asset asset = findById(assetId);

    if (asset.getStatus() == AssetStatus.IN_MAINTENANCE
        || asset.getStatus() == AssetStatus.RETIRED) {
      throw new RuntimeException("Ativo não pode ser transferido neste status");
    }

    asset.changeUnit(newUnit);
    asset.setStatus(AssetStatus.IN_TRANSFER);
  }

  /** Marca o ativo como desativado definitivamente. */
  @Transactional
  public void retireAsset(Long assetId) {
    Asset asset = findById(assetId);
    asset.setStatus(AssetStatus.RETIRED);
    asset.unassignUser();
  }

  private void validateAssetTagUniqueness(String assetTag) {
    Optional<Asset> existing = assetRepository.findByAssetTag(assetTag);
    if (existing.isPresent()) {
      throw new RuntimeException("Já existe um ativo com este identificador");
    }
  }
}
