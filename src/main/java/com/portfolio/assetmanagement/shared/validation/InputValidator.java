package com.portfolio.assetmanagement.shared.validation;

import com.portfolio.assetmanagement.shared.exception.ValidationException;
import java.util.regex.Pattern;

/**
 * Validador de entrada.
 *
 * <p>Protege contra dados inválidos e inconsistentes.
 */
public final class InputValidator {

  private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$");

  private InputValidator() {}

  public static void requireNonNull(Object value, String fieldName) {

    if (value == null) {
      throw new ValidationException(fieldName + " é obrigatório");
    }
  }

  public static void requireNonBlank(String value, String fieldName) {

    if (value == null || value.isBlank()) {
      throw new ValidationException(fieldName + " é obrigatório");
    }
  }

  public static void requireMaxLength(String value, int maxLength, String fieldName) {

    if (value != null && value.length() > maxLength) {

      throw new ValidationException(fieldName + " não pode exceder " + maxLength + " caracteres");
    }
  }

  public static void validateEmail(String email) {

    requireNonBlank(email, "Email");

    if (!EMAIL_PATTERN.matcher(email).matches()) {

      throw new ValidationException("Formato de email inválido");
    }
  }

  public static void requirePositive(Long value, String fieldName) {

    if (value == null || value <= 0) {

      throw new ValidationException(fieldName + " deve ser positivo");
    }
  }
}
