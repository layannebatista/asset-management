package com.portfolio.assetmanagement.application.asset.service;

import com.portfolio.assetmanagement.infrastructure.persistence.asset.repository.AssetRepository;
import java.time.Instant;
import java.util.UUID;
import org.springframework.stereotype.Service;

/**
 * Serviço responsável por gerar assetTag único.
 *
 * <p>Garante unicidade e formato consistente enterprise.
 */
@Service
public class AssetNumberGeneratorService {

  private final AssetRepository assetRepository;

  public AssetNumberGeneratorService(AssetRepository assetRepository) {

    this.assetRepository = assetRepository;
  }

  /**
   * Gera novo assetTag único.
   *
   * <p>Formato: AST-{timestamp}-{random}
   *
   * <p>Exemplo: AST-1707752201-A1B2C3
   */
  public String generate() {

    String assetTag;

    do {

      assetTag = build();

    } while (assetRepository.existsByAssetTag(assetTag));

    return assetTag;
  }

  private String build() {

    long timestamp = Instant.now().getEpochSecond();

    String random = UUID.randomUUID().toString().substring(0, 6).toUpperCase();

    return "AST-" + timestamp + "-" + random;
  }
}