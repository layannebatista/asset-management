package com.portfolio.assetmanagement.interfaces.rest.auth.controller;

import com.portfolio.assetmanagement.security.context.LoggedUserContext;
import com.portfolio.assetmanagement.security.dto.LoginRequestDTO;
import com.portfolio.assetmanagement.security.dto.LoginResponseDTO;
import com.portfolio.assetmanagement.security.dto.MfaVerifyRequestDTO;
import com.portfolio.assetmanagement.security.dto.RefreshRequestDTO;
import com.portfolio.assetmanagement.security.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.*;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Auth", description = "Autenticação, MFA via WhatsApp e gerenciamento de tokens")
@RestController
@RequestMapping("/auth")
public class AuthController {

  private final AuthService authService;
  private final LoggedUserContext loggedUser;

  public AuthController(AuthService authService, LoggedUserContext loggedUser) {
    this.authService = authService;
    this.loggedUser = loggedUser;
  }

  @Operation(
      summary = "Login",
      description =
          """
      Autentica com email e senha.
      - Usuário **com** telefone: inicia MFA, retorna `mfaRequired: true`.
        JWT só é emitido após `/auth/mfa/verify`.
      - Usuário **sem** telefone: retorna `accessToken` + `refreshToken` diretamente.
      """)
  @ApiResponses({
    @ApiResponse(responseCode = "200", description = "Autenticado ou challenge MFA"),
    @ApiResponse(responseCode = "401", description = "Credenciais inválidas")
  })
  @PostMapping("/login")
  public ResponseEntity<LoginResponseDTO> login(@RequestBody @Valid LoginRequestDTO request) {
    return ResponseEntity.ok(authService.authenticate(request));
  }

  @Operation(
      summary = "Verificar código MFA",
      description =
          """
      Valida o OTP de 6 dígitos enviado via WhatsApp.
      Retorna `accessToken` + `refreshToken` se válido.
      Código expira em 5 minutos e é de uso único.
      """)
  @PostMapping("/mfa/verify")
  public ResponseEntity<LoginResponseDTO> verifyMfa(
      @RequestBody @Valid MfaVerifyRequestDTO request) {
    return ResponseEntity.ok(authService.verifyMfa(request));
  }

  @Operation(
      summary = "Renovar access token",
      description =
          """
      Recebe um `refreshToken` válido e retorna um novo `accessToken` + novo `refreshToken`.
      O token recebido é revogado automaticamente (rotação).
      Refresh tokens expiram em 7 dias.
      """)
  @ApiResponses({
    @ApiResponse(responseCode = "200", description = "Tokens renovados"),
    @ApiResponse(responseCode = "400", description = "Refresh token inválido ou expirado")
  })
  @PostMapping("/refresh")
  public ResponseEntity<LoginResponseDTO> refresh(@RequestBody @Valid RefreshRequestDTO request) {
    return ResponseEntity.ok(authService.refresh(request));
  }

  @Operation(
      summary = "Logout",
      description =
          """
      Revoga todos os refresh tokens do usuário autenticado.
      O access token atual continua válido até expirar (stateless JWT).
      """)
  @PostMapping("/logout")
  public ResponseEntity<Void> logout() {
    authService.logout(loggedUser.getUserId());
    return ResponseEntity.noContent().build();
  }
}
