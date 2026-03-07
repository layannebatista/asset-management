package com.portfolio.assetmanagement.application.transfer.service;

import com.portfolio.assetmanagement.domain.asset.entity.Asset;
import com.portfolio.assetmanagement.infrastructure.persistence.asset.repository.AssetRepository;
import com.portfolio.assetmanagement.shared.exception.NotFoundException;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Serviço responsável por proteger operações de transferência contra concorrência.
 *
 * <p>Utiliza lock pessimista no banco de dados (PESSIMISTIC_WRITE), garantindo proteção em
 * ambientes com múltiplas instâncias (Kubernetes, load balancer).
 *
 * <p>A abordagem anterior com ConcurrentHashMap + ReentrantLock era local à JVM e completamente
 * ineficaz em deployments horizontalmente escalados.
 */
@Service
public class TransferConcurrencyService {

  private final AssetRepository assetRepository;

  @PersistenceContext private EntityManager entityManager;

  public TransferConcurrencyService(AssetRepository assetRepository) {
    this.assetRepository = assetRepository;
  }

  /**
   * Executa operação com lock pessimista no banco para o asset.
   *
   * <p>O lock PESSIMISTIC_WRITE bloqueia o registro no banco até o fim da transação, serializando
   * operações concorrentes em qualquer número de instâncias da aplicação.
   */
  @Transactional
  public void executeWithAssetLock(Long assetId, Runnable operation) {

    if (assetId == null) {
      throw new IllegalArgumentException("assetId é obrigatório");
    }

    Asset asset =
        assetRepository
            .findById(assetId)
            .orElseThrow(() -> new NotFoundException("Ativo não encontrado"));

    entityManager.lock(asset, LockModeType.PESSIMISTIC_WRITE);

    operation.run();
  }
}
