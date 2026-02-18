package com.portfolio.assetmanagement.shared.exception;

/**
 * Exceção lançada quando ocorre conflito de concorrência.
 *
 * <p>Exemplos: - Dois usuários tentando transferir o mesmo asset - Dois processos tentando
 * modificar o mesmo registro - Versão inconsistente de entidade (optimistic locking)
 */
public class ConcurrencyException extends RuntimeException {

  public ConcurrencyException(String message) {
    super(message);
  }

  public ConcurrencyException(String message, Throwable cause) {
    super(message, cause);
  }
}