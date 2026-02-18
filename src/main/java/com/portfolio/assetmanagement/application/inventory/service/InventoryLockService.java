package com.portfolio.assetmanagement.application.inventory.service;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.locks.ReentrantLock;
import java.util.function.Supplier;
import org.springframework.stereotype.Service;

/**
 * Serviço responsável por controle de concorrência em InventorySession.
 *
 * <p>Evita race conditions ao iniciar, fechar ou cancelar sessões.
 */
@Service
public class InventoryLockService {

  private final ConcurrentHashMap<Long, ReentrantLock> locks = new ConcurrentHashMap<>();

  /** Executa operação protegida por lock da sessão. */
  public <T> T executeWithSessionLock(Long sessionId, Supplier<T> operation) {

    if (sessionId == null) {
      throw new IllegalArgumentException("sessionId é obrigatório");
    }

    ReentrantLock lock = locks.computeIfAbsent(sessionId, id -> new ReentrantLock());

    lock.lock();

    try {

      return operation.get();

    } finally {

      lock.unlock();
    }
  }
}
