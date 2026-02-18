package com.portfolio.assetmanagement.shared.exception;

import com.portfolio.assetmanagement.shared.dto.FieldErrorDTO;
import java.util.List;

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