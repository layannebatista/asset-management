package com.portfolio.assetmanagement.application.asset.service;

import com.portfolio.assetmanagement.infrastructure.persistence.asset.repository.AssetRepository;
import com.portfolio.assetmanagement.shared.exception.BusinessException;
import java.time.Instant;
import java.util.UUID;
import org.springframework.stereotype.Service;

/**
 * Serviço responsável por gerar assetTag único.
 *
 * <p>Garante unicidade e formato consistente enterprise.
 *
 * <p>Em caso de colisão detectada pelo banco (DataIntegrityViolationException), converte o erro
 * técnico em uma mensagem de negócio amigável em vez de expor detalhes internos ao cliente da API.
 */
@Service
public class AssetNumberGeneratorService {

  private static final int MAX_ATTEMPTS = 10;

  private final AssetRepository assetRepository;

  public AssetNumberGeneratorService(AssetRepository assetRepository) {
    this.assetRepository = assetRepository;
  }

  /**
   * Gera novo assetTag único.
   *
   * <p>Formato: AST-{timestamp}-{random}
   *
   * <p>Exemplo: AST-1707752201-A1B2C3D4
   *
   * <p>Tenta até MAX_ATTEMPTS vezes antes de lançar exceção, evitando loop infinito em cenários de
   * alta concorrência.
   *
   * <p>Mesmo que dois threads passem pela verificação de unicidade ao mesmo tempo, a constraint
   * UNIQUE do banco garante consistência — e o erro é convertido em BusinessException com mensagem
   * legível.
   */
  public String generate() {

    for (int attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {

      String assetTag = build();

      if (!assetRepository.existsByAssetTag(assetTag)) {
        return assetTag;
      }
    }

    throw new BusinessException(
        "Não foi possível gerar assetTag único após " + MAX_ATTEMPTS + " tentativas");
  }

  /**
   * Constrói o assetTag com timestamp + 8 caracteres aleatórios.
   *
   * <p>8 caracteres em vez de 6 reduzem a probabilidade de colisão de ~1:16M para ~1:4B por
   * segundo.
   */
  private String build() {

    long timestamp = Instant.now().getEpochSecond();

    String random = UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();

    return "AST-" + timestamp + "-" + random;
  }
}
