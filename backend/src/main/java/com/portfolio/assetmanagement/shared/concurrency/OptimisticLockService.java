package com.portfolio.assetmanagement.shared.concurrency;

import com.portfolio.assetmanagement.shared.exception.BusinessException;
import jakarta.persistence.OptimisticLockException;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.stereotype.Component;

@Component
public class OptimisticLockService {

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

  @FunctionalInterface
  public interface Operation<T> {
    T run();
  }

  @FunctionalInterface
  public interface VoidOperation {
    void run();
  }
}
