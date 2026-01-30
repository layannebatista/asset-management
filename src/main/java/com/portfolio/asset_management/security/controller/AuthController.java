package com.portfolio.asset_management.security.controller;

import com.portfolio.asset_management.security.dto.LoginRequestDTO;
import com.portfolio.asset_management.security.dto.LoginResponseDTO;
import com.portfolio.asset_management.security.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller responsável pelos endpoints de autenticação.
 *
 * <p>Este controller recebe as credenciais do usuário e delega a autenticação para a camada de
 * serviço.
 */
@RestController
@RequestMapping("/auth")
public class AuthController {

  private final AuthService authService;

  public AuthController(AuthService authService) {
    this.authService = authService;
  }

  @PostMapping("/login")
  public ResponseEntity<LoginResponseDTO> login(@Valid @RequestBody LoginRequestDTO request) {
    LoginResponseDTO response = authService.authenticate(request);
    return ResponseEntity.ok(response);
  }
}
