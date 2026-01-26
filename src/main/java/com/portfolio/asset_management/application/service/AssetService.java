package com.portfolio.asset_management.application.service;

import com.portfolio.asset_management.domain.asset.Asset;
import com.portfolio.asset_management.domain.asset.AssetStatus;
import com.portfolio.asset_management.infrastructure.persistence.AssetRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AssetService {

  private final AssetRepository assetRepository;

  public AssetService(AssetRepository assetRepository) {
    this.assetRepository = assetRepository;
  }

  /* ======================================================
  CRIAR ATIVO
  ====================================================== */

  @Transactional
  public Asset createAsset(String assetCode) {

    if (assetCode == null || assetCode.isBlank()) {
      throw new IllegalArgumentException("Código do ativo é obrigatório");
    }

    boolean exists = assetRepository.existsByAssetCode(assetCode);
    if (exists) {
      throw new IllegalStateException("Já existe um ativo com esse código");
    }

    Asset asset = new Asset(assetCode);
    return assetRepository.save(asset);
  }

  /* ======================================================
  BUSCAR ATIVO POR ID
  ====================================================== */

  @Transactional(readOnly = true)
  public Asset getAssetById(UUID id) {
    return assetRepository
        .findById(id)
        .orElseThrow(() -> new IllegalStateException("Ativo não encontrado"));
  }

  /* ======================================================
  BUSCAR ATIVO POR CÓDIGO
  ====================================================== */

  @Transactional(readOnly = true)
  public Asset getAssetByCode(String assetCode) {
    return assetRepository
        .findByAssetCode(assetCode)
        .orElseThrow(() -> new IllegalStateException("Ativo não encontrado"));
  }

  /* ======================================================
  LISTAR ATIVOS
  ====================================================== */

  @Transactional(readOnly = true)
  public List<Asset> listAssets(AssetStatus status) {
    if (status == null) {
      return assetRepository.findAll();
    }
    return assetRepository.findAllByStatus(status);
  }
}
