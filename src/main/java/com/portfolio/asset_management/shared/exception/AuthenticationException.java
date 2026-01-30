package com.portfolio.asset_management.shared.exception;

/**
 * Exceção lançada quando ocorre falha no processo de autenticação.
 *
 * <p>Utilizada para representar credenciais inválidas ou tentativas de acesso não autorizadas, sem
 * expor detalhes sensíveis.
 */
public class AuthenticationException extends RuntimeException {

  public AuthenticationException(String message) {
    super(message);
  }
}
