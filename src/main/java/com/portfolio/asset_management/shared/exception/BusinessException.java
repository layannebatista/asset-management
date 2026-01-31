package com.portfolio.asset_management.shared.exception;

/**
 * Exceção lançada quando uma regra de negócio é violada.
 *
 * <p>Utilizada para cenários onde a requisição é válida do ponto de vista técnico, mas inválida do
 * ponto de vista do domínio.
 */
public class BusinessException extends RuntimeException {

  public BusinessException(String message) {
    super(message);
  }
}
