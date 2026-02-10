package com.portfolio.asset_management.shared.exception;

feature/maintenance-module
import java.util.List;

import com.portfolio.asset_management.shared.dto.FieldErrorDTO;

/**
 * Exception lançada quando ocorre violação de regra de negócio ou erro de validação funcional.
 *
 * <p>Esta exception representa um erro causado por dados inválidos ou estado inválido do sistema,
 * e deve resultar em resposta HTTP 400 (Bad Request).
 */
import com.portfolio.asset_management.shared.dto.FieldErrorDTO;
import java.util.List;

main
public class ValidationException extends RuntimeException {

  private final List<FieldErrorDTO> fieldErrors;

  public ValidationException(String message) {
    super(message);
    this.fieldErrors = null;
  }

  public ValidationException(String message, List<FieldErrorDTO> fieldErrors) {
    super(message);
    this.fieldErrors = fieldErrors;
  }

  public ValidationException(String message, Throwable cause) {
    super(message, cause);
    this.fieldErrors = null;
  }

  public List<FieldErrorDTO> getFieldErrors() {
    return fieldErrors;
  }
}
