package com.portfolio.asset_management.shared.exception;

/**
 * Exception lançada quando ocorre violação de regra de negócio ou erro de validação funcional.
 *
 * <p>Esta exception representa um erro causado por dados inválidos ou estado inválido do sistema, e
 * deve resultar em resposta HTTP 400 (Bad Request).
 */
public class ValidationException extends RuntimeException {

  public ValidationException(String message) {
    super(message);
  }

  public ValidationException(String message, Throwable cause) {
    super(message, cause);
  }
}
