package com.portfolio.asset_management.security.service;

import com.portfolio.asset_management.security.enums.UserRole;

/**
 * Service responsável por definir o contrato de geração e validação de tokens.
 *
 * <p>A implementação concreta (ex: JWT) será adicionada posteriormente. Este service existe para
 * desacoplar a autenticação da tecnologia de token.
 */
public class TokenService {

  public String generateToken(String subject, UserRole role) {
    // Implementação temporária.
    // A geração real do token será adicionada futuramente.
    return "temporary-token";
  }

  public boolean validateToken(String token) {
    // Implementação temporária.
    return true;
  }
}
