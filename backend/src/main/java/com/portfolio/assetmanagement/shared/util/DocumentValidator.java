package com.portfolio.assetmanagement.shared.util;

import com.portfolio.assetmanagement.shared.exception.ValidationException;

public final class DocumentValidator {

  private DocumentValidator() {}

  public static void validate(String document) {

    if (document == null) {
      throw new ValidationException("Document must not be null");
    }

    String normalized = normalize(document);

    if (normalized.isEmpty()) {
      throw new ValidationException("Document must not be empty");
    }

    if (!normalized.matches("\\d+")) {
      throw new ValidationException("Document must contain only digits");
    }

    if (normalized.length() < 5) {
      throw new ValidationException("Document length is invalid");
    }
  }

  public static String normalize(String document) {

    if (document == null) {
      return null;
    }

    return document.replaceAll("[^0-9]", "");
  }
}
