package com.portfolio.asset_management.application.service.security;

import com.portfolio.asset_management.security.JwtService;
import com.portfolio.asset_management.security.Role;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

  private final JwtService jwtService;

  public AuthService(JwtService jwtService) {
    this.jwtService = jwtService;
  }

  /**
   * LOGIN TEMPORÁRIO (CONTROLADO)
   *
   * <p>Usuários válidos: admin / admin -> ADMIN gestor / gestor -> GESTOR user / user -> USUARIO
   */
  public String login(String username, String password) {

    if ("admin".equals(username) && "admin".equals(password)) {
      return jwtService.generateToken(UUID.randomUUID(), List.of(Role.ADMIN));
    }

    if ("gestor".equals(username) && "gestor".equals(password)) {
      return jwtService.generateToken(UUID.randomUUID(), List.of(Role.GESTOR));
    }

    if ("user".equals(username) && "user".equals(password)) {
      return jwtService.generateToken(UUID.randomUUID(), List.of(Role.USUARIO));
    }

    throw new IllegalStateException("Usuário ou senha inválidos");
  }
}
