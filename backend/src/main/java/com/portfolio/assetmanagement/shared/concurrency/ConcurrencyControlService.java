package com.portfolio.assetmanagement.shared.concurrency;

import com.portfolio.assetmanagement.shared.exception.BusinessException;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class ConcurrencyControlService {

  @PersistenceContext private EntityManager entityManager;

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

  @Transactional
  public void flush() {
    entityManager.flush();
  }

  @Transactional
  public <T> T refresh(T entity) {

    if (entity == null) {
      throw new IllegalArgumentException("entity é obrigatório");
    }

    entityManager.refresh(entity);
    return entity;
  }

  public boolean isManaged(Object entity) {
    return entityManager.contains(entity);
  }
}
