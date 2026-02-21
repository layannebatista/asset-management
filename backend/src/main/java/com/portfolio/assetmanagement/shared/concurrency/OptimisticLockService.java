package com.portfolio.assetmanagement.shared.concurrency;

import com.portfolio.assetmanagement.shared.exception.BusinessException;
import jakarta.persistence.OptimisticLockException;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.stereotype.Service;

/**
 * Serviço responsável por tratar e padronizar controle de concorrência otimista.
 *
 * <p>Baseado no mecanismo @Version do JPA/Hibernate.
 *
 * <p>Protege contra:
 *
 * <p>- Lost update - Double submit - Race conditions - Escritas concorrentes
 *
 * <p>Uso enterprise padrão em todos os services críticos.
 */
@Service
public class OptimisticLockService {

  /**
   * Executa operação protegida por optimistic locking.
   *
   * <p>Uso:
   *
   * <p>optimisticLockService.execute(() -> repository.save(entity));
   */
  public <T> T execute(Operation<T> operation) {

    try {

      return operation.run();

    } catch (OptimisticLockException ex) {

      throw new BusinessException(
          "O registro foi modificado por outro usuário. Atualize e tente novamente.");

    } catch (OptimisticLockingFailureException ex) {

      throw new BusinessException(
          "Conflito de concorrência detectado. Atualize os dados antes de salvar.");

    } catch (Exception ex) {

      throw ex;
    }
  }

  /** Versão void. */
  public void executeVoid(VoidOperation operation) {

    try {

      operation.run();

    } catch (OptimisticLockException ex) {

      throw new BusinessException(
          "O registro foi modificado por outro usuário. Atualize e tente novamente.");

    } catch (OptimisticLockingFailureException ex) {

      throw new BusinessException(
          "Conflito de concorrência detectado. Atualize os dados antes de salvar.");

    } catch (Exception ex) {

      throw ex;
    }
  }

  /** Interface funcional para operações com retorno. */
  @FunctionalInterface
  public interface Operation<T> {

    T run();
  }

  /** Interface funcional para operações void. */
  @FunctionalInterface
  public interface VoidOperation {

    void run();
  }
}
