package com.portfolio.assetmanagement.application.transfer.service;

import com.portfolio.assetmanagement.shared.exception.BusinessException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.locks.ReentrantLock;
import org.springframework.stereotype.Service;

/**
 * Serviço responsável por proteger operações de transferência contra concorrência.
 *
 * <p>Garante que apenas uma transferência por asset seja processada por vez.
 *
 * <p>Protege contra:
 *
 * <p>- race conditions - double transfer request - corrupção de estado do asset
 */
@Service
public class TransferConcurrencyService {

  /** Lock por assetId. */
  private final Map<Long, ReentrantLock> locks = new ConcurrentHashMap<>();

  /** Executa operação com lock exclusivo por asset. */
  public void executeWithAssetLock(Long assetId, Runnable operation) {

    if (assetId == null) {

      throw new IllegalArgumentException("assetId é obrigatório");
    }

    ReentrantLock lock = locks.computeIfAbsent(assetId, id -> new ReentrantLock());

    boolean acquired = lock.tryLock();

    if (!acquired) {

      throw new BusinessException("Transferência já está sendo processada para este ativo");
    }

    try {

      operation.run();

    } finally {

      lock.unlock();

      /** Remove lock se não houver threads esperando. */
      if (!lock.hasQueuedThreads()) {

        locks.remove(assetId);
      }
    }
  }
}
