package com.portfolio.asset_management.shared.exception;

/**
 * Exceção lançada quando um recurso não é encontrado.
 *
 * <p>Utilizada para representar cenários onde o recurso solicitado não existe ou não está
 * disponível no contexto atual.
 */
public class NotFoundException extends RuntimeException {

  public NotFoundException(String message) {
    super(message);
  }
}
