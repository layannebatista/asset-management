package com.portfolio.assetmanagement.interfaces.rest.user.controller;

import com.portfolio.assetmanagement.application.user.service.UserActivationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.*;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@Tag(
    name = "User Activation",
    description = "Fluxo de ativação de usuário e definição de senha (primeiro acesso)")
@RestController
@RequestMapping("/users/activation")
public class UserActivationController {

  private final UserActivationService activationService;

  public UserActivationController(UserActivationService activationService) {
    this.activationService = activationService;
  }

  /* ============================================================
   *  GERAR TOKEN DE ATIVAÇÃO
   * ============================================================ */

  @Operation(
      summary = "Gerar token de ativação",
      description =
          """
          Gera um token de ativação para um usuário recém-criado.
          O token será utilizado no fluxo de primeiro acesso.
          Acesso restrito a ADMIN.
          """)
  @ApiResponses({
    @ApiResponse(responseCode = "200", description = "Token gerado com sucesso"),
    @ApiResponse(responseCode = "403", description = "Sem permissão para gerar token"),
    @ApiResponse(responseCode = "404", description = "Usuário não encontrado")
  })
  @PostMapping("/token/{userId}")
  @PreAuthorize("hasRole('ADMIN')")
  public String generateToken(
      @Parameter(description = "ID do usuário", example = "5") @PathVariable Long userId) {

    return activationService.generateActivationToken(userId);
  }

  /* ============================================================
   *  ATIVAR USUÁRIO
   * ============================================================ */

  @Operation(
      summary = "Ativar usuário",
      description =
          """
          Ativa o usuário utilizando o token de ativação.
          Regras:
          - Token deve ser válido e não expirado
          - Senhas devem coincidir
          - LGPD deve estar aceita
          - Define senha inicial do usuário
          Este endpoint é público pois o usuário ainda não está autenticado.
          """)
  @ApiResponses({
    @ApiResponse(responseCode = "200", description = "Usuário ativado com sucesso"),
    @ApiResponse(responseCode = "400", description = "Dados inválidos ou senhas não coincidem"),
    @ApiResponse(responseCode = "401", description = "Token inválido ou expirado")
  })
  @PostMapping("/activate")
  public void activateUser(
      @Parameter(description = "Token de ativação recebido por e-mail", example = "abc123-token")
          @RequestParam
          String token,
      @Parameter(description = "Senha desejada", example = "Password@123") @RequestParam
          String password,
      @Parameter(description = "Confirmação da senha", example = "Password@123") @RequestParam
          String confirmPassword,
      @Parameter(description = "Aceite do termo LGPD", example = "true") @RequestParam
          boolean lgpdAccepted) {

    activationService.activateUser(token, password, confirmPassword, lgpdAccepted);
  }
}
