package com.portfolio.asset_management.shared.validation;

import com.portfolio.asset_management.shared.exception.BusinessException;

/**
 * Validador de transições de estado.
 *
 * <p>Garante lifecycle correto das entidades.
 */
public final class StateValidator {

  private StateValidator() {}

  public static <T extends Enum<T>> void requireState(
      T currentState, T expectedState, String message) {

    if (currentState != expectedState) {
      throw new BusinessException(message);
    }
  }

  public static <T extends Enum<T>> void forbidState(
      T currentState, T forbiddenState, String message) {

    if (currentState == forbiddenState) {
      throw new BusinessException(message);
    }
  }

  public static <T extends Enum<T>> void requireOneOf(
      T currentState, T[] allowedStates, String message) {

    for (T state : allowedStates) {
      if (state == currentState) {
        return;
      }
    }

    throw new BusinessException(message);
  }
}
