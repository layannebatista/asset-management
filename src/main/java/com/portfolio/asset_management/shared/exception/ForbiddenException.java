package com.portfolio.asset_management.shared.exception;

/**
 * Exceção lançada quando o usuário não possui permissão para executar a operação solicitada.
 *
 * <p>Utilizada para representar violações de regras de autorização (RBAC / ABAC).
 */
public class ForbiddenException extends RuntimeException {

  public ForbiddenException(String message) {
    super(message);
  }
}
