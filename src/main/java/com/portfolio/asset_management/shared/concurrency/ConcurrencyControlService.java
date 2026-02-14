package com.portfolio.asset_management.shared.concurrency;

import com.portfolio.asset_management.shared.exception.BusinessException;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Serviço responsável por controle explícito de concorrência pessimista.
 *
 * <p>Usado em cenários críticos onde optimistic locking não é suficiente.
 *
 * <p>Exemplos:
 *
 * <p>- Transferências simultâneas do mesmo asset - Atribuição concorrente - Inventário concorrente
 * - Operações financeiras ou críticas
 *
 * <p>Utiliza:
 *
 * <p>LockModeType.PESSIMISTIC_WRITE
 *
 * <p>Isso bloqueia o registro no banco até o commit da transação.
 */
@Service
public class ConcurrencyControlService {

  @PersistenceContext private EntityManager entityManager;

  /**
   * Aplica lock pessimista WRITE.
   *
   * <p>Bloqueia o registro até o commit.
   */
  @Transactional
  public <T> T lockForUpdate(Class<T> entityClass, Long id) {

    if (entityClass == null) {

      throw new IllegalArgumentException("entityClass é obrigatório");
    }

    if (id == null) {

      throw new IllegalArgumentException("id é obrigatório");
    }

    T entity = entityManager.find(entityClass, id, LockModeType.PESSIMISTIC_WRITE);

    if (entity == null) {

      throw new BusinessException(entityClass.getSimpleName() + " não encontrado para lock");
    }

    return entity;
  }

  /**
   * Aplica lock pessimista READ.
   *
   * <p>Evita modificações concorrentes, mas permite leitura.
   */
  @Transactional
  public <T> T lockForRead(Class<T> entityClass, Long id) {

    if (entityClass == null) {

      throw new IllegalArgumentException("entityClass é obrigatório");
    }

    if (id == null) {

      throw new IllegalArgumentException("id é obrigatório");
    }

    T entity = entityManager.find(entityClass, id, LockModeType.PESSIMISTIC_READ);

    if (entity == null) {

      throw new BusinessException(entityClass.getSimpleName() + " não encontrado para lock");
    }

    return entity;
  }

  /** Força sincronização com banco. */
  @Transactional
  public void flush() {

    entityManager.flush();
  }

  /** Força refresh do estado atual do banco. */
  @Transactional
  public <T> T refresh(T entity) {

    if (entity == null) {

      throw new IllegalArgumentException("entity é obrigatório");
    }

    entityManager.refresh(entity);

    return entity;
  }

  /** Verifica se entidade está gerenciada. */
  public boolean isManaged(Object entity) {

    return entityManager.contains(entity);
  }
}
