package com.portfolio.asset_management.shared.validation;

import com.portfolio.asset_management.shared.exception.BusinessException;

/**
 * Validador central para regras de negócio.
 *
 * <p>Evita duplicação de código e garante consistência enterprise.
 */
public final class BusinessValidator {

  private BusinessValidator() {}

  public static void require(boolean condition, String message) {

    if (!condition) {
      throw new BusinessException(message);
    }
  }

  public static void requireNonNull(Object value, String fieldName) {

    if (value == null) {
      throw new BusinessException(fieldName + " é obrigatório");
    }
  }

  public static void requireNonBlank(String value, String fieldName) {

    if (value == null || value.isBlank()) {
      throw new BusinessException(fieldName + " é obrigatório");
    }
  }

  public static void requirePositive(Long value, String fieldName) {

    if (value == null || value <= 0) {
      throw new BusinessException(fieldName + " deve ser positivo");
    }
  }

  public static void requireFalse(boolean condition, String message) {

    if (condition) {
      throw new BusinessException(message);
    }
  }

  public static void requireTrue(boolean condition, String message) {

    if (!condition) {
      throw new BusinessException(message);
    }
  }
}
