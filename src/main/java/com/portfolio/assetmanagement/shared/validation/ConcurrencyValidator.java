package com.portfolio.assetmanagement.shared.validation;

import com.portfolio.assetmanagement.shared.exception.ConcurrencyException;

/**
 * Validador de concorrência.
 *
 * <p>Protege contra race conditions e conflitos simultâneos.
 */
public final class ConcurrencyValidator {

  private ConcurrencyValidator() {}

  public static void requireNotModified(boolean condition, String message) {

    if (!condition) {

      throw new ConcurrencyException(message);
    }
  }

  public static void requireAvailable(boolean available, String resourceName) {

    if (!available) {

      throw new ConcurrencyException(resourceName + " está sendo modificado por outra operação");
    }
  }

  public static void requireVersionMatch(Long expectedVersion, Long actualVersion) {

    if (expectedVersion == null || actualVersion == null) {

      throw new ConcurrencyException("Versão inválida");
    }

    if (!expectedVersion.equals(actualVersion)) {

      throw new ConcurrencyException("Conflito de concorrência detectado");
    }
  }
}