package com.portfolio.assetmanagement.application.inventory.service;

import com.portfolio.assetmanagement.domain.inventory.entity.InventorySession;
import com.portfolio.assetmanagement.shared.exception.NotFoundException;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import jakarta.persistence.PersistenceContext;
import java.util.function.Supplier;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Serviço responsável por controle de concorrência em InventorySession.
 *
 * <p>Usa lock pessimista no banco de dados (PESSIMISTIC_WRITE), garantindo proteção em ambientes
 * com múltiplas instâncias (Kubernetes, load balancer).
 *
 * <p>A abordagem anterior com ConcurrentHashMap + ReentrantLock era local à JVM e completamente
 * ineficaz em deployments horizontalmente escalados.
 */
@Service
public class InventoryLockService {

  @PersistenceContext private EntityManager entityManager;

  /**
   * Executa operação protegida por lock pessimista no banco para a sessão de inventário.
   *
   * <p>O lock PESSIMISTIC_WRITE bloqueia o registro no banco até o fim da transação, serializando
   * operações concorrentes em qualquer número de instâncias da aplicação.
   */
  @Transactional
  public <T> T executeWithSessionLock(Long sessionId, Supplier<T> operation) {

    if (sessionId == null) {
      throw new IllegalArgumentException("sessionId é obrigatório");
    }

    InventorySession session =
        entityManager.find(InventorySession.class, sessionId, LockModeType.PESSIMISTIC_WRITE);

    if (session == null) {
      throw new NotFoundException("Inventory session not found");
    }

    return operation.get();
  }
}
