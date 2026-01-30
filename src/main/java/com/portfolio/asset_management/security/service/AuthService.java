package com.portfolio.asset_management.security.service;

import com.portfolio.asset_management.security.dto.LoginRequestDTO;
import com.portfolio.asset_management.security.dto.LoginResponseDTO;
import com.portfolio.asset_management.security.enums.UserRole;
import org.springframework.stereotype.Service;

/**
 * Service responsável por orquestrar o processo de autenticação.
 *
 * <p>Centraliza a lógica de login e será responsável futuramente pela validação de credenciais e
 * geração de tokens.
 */
@Service
public class AuthService {

  public LoginResponseDTO authenticate(LoginRequestDTO request) {
    // Implementação temporária para permitir evolução incremental do módulo.
    // A validação real e geração de token serão adicionadas posteriormente.
    return new LoginResponseDTO("temporary-token", "Bearer", UserRole.OPERADOR);
  }
}
