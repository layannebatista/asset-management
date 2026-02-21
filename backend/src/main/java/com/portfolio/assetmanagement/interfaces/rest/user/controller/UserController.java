package com.portfolio.assetmanagement.interfaces.rest.user.controller;

import com.portfolio.assetmanagement.application.organization.service.OrganizationService;
import com.portfolio.assetmanagement.application.unit.service.UnitService;
import com.portfolio.assetmanagement.application.user.service.UserService;
import com.portfolio.assetmanagement.domain.organization.entity.Organization;
import com.portfolio.assetmanagement.domain.unit.entity.Unit;
import com.portfolio.assetmanagement.domain.user.entity.User;
import com.portfolio.assetmanagement.security.enums.UserRole;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.*;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Users", description = "Gerenciamento de usuários e controle de acesso")
@RestController
@RequestMapping("/users")
public class UserController {

  private final UserService userService;
  private final OrganizationService organizationService;
  private final UnitService unitService;

  public UserController(
      UserService userService, OrganizationService organizationService, UnitService unitService) {

    this.userService = userService;
    this.organizationService = organizationService;
    this.unitService = unitService;
  }

  /* ============================================================
   *  CRIAR USUÁRIO
   * ============================================================ */

  @Operation(
      summary = "Criar novo usuário",
      description =
          """
          Cria um novo usuário no sistema.

          Regras:
          - Apenas ADMIN pode executar
          - Usuário deve estar vinculado a uma organização válida
          - Usuário deve estar vinculado a uma unidade válida
          - Define o papel (ADMIN, MANAGER, OPERATOR)

          Multi-tenant safe.
          """)
  @ApiResponses({
    @ApiResponse(responseCode = "200", description = "Usuário criado com sucesso"),
    @ApiResponse(responseCode = "400", description = "Dados inválidos"),
    @ApiResponse(responseCode = "404", description = "Organização ou unidade não encontrada"),
    @ApiResponse(responseCode = "403", description = "Acesso negado")
  })
  @PreAuthorize("hasRole('ADMIN')")
  @PostMapping
  public User createUser(
      @Parameter(description = "Nome do usuário", example = "Maria Silva") @RequestParam
          String name,
      @Parameter(description = "Email do usuário", example = "maria@empresa.com") @RequestParam
          String email,
      @Parameter(description = "Senha inicial", example = "Password@123") @RequestParam
          String password,
      @Parameter(description = "Perfil do usuário", example = "MANAGER") @RequestParam
          UserRole role,
      @Parameter(description = "ID da organização", example = "1") @RequestParam
          Long organizationId,
      @Parameter(description = "ID da unidade", example = "10") @RequestParam Long unitId,
      @Parameter(description = "Documento (CPF/CNPJ)", example = "12345678900") @RequestParam
          String documentNumber) {

    Organization organization = organizationService.findById(organizationId);
    Unit unit = unitService.findById(unitId);

    return userService.createUser(name, email, password, role, organization, unit, documentNumber);
  }

  /* ============================================================
   *  BUSCAR USUÁRIO
   * ============================================================ */

  @Operation(
      summary = "Buscar usuário por ID",
      description = "Retorna os dados completos do usuário.")
  @ApiResponses({
    @ApiResponse(responseCode = "200", description = "Usuário encontrado"),
    @ApiResponse(responseCode = "404", description = "Usuário não encontrado")
  })
  @PreAuthorize("hasRole('ADMIN')")
  @GetMapping("/{id}")
  public User findById(
      @Parameter(description = "ID do usuário", example = "5") @PathVariable Long id) {

    return userService.findById(id);
  }

  /* ============================================================
   *  BLOQUEAR USUÁRIO
   * ============================================================ */

  @Operation(
      summary = "Bloquear usuário",
      description =
          """
          Bloqueia o usuário.

          Usuário bloqueado não consegue autenticar.
          """)
  @PreAuthorize("hasRole('ADMIN')")
  @PatchMapping("/{id}/block")
  public void blockUser(
      @Parameter(description = "ID do usuário", example = "5") @PathVariable Long id) {

    userService.blockUser(id);
  }

  /* ============================================================
   *  ATIVAR USUÁRIO
   * ============================================================ */

  @Operation(summary = "Ativar usuário", description = "Move o usuário para status ACTIVE.")
  @PreAuthorize("hasRole('ADMIN')")
  @PatchMapping("/{id}/activate")
  public void activateUser(
      @Parameter(description = "ID do usuário", example = "5") @PathVariable Long id) {

    userService.activateUser(id);
  }

  /* ============================================================
   *  INATIVAR USUÁRIO
   * ============================================================ */

  @Operation(summary = "Inativar usuário", description = "Move o usuário para status INACTIVE.")
  @PreAuthorize("hasRole('ADMIN')")
  @PatchMapping("/{id}/inactivate")
  public void inactivateUser(
      @Parameter(description = "ID do usuário", example = "5") @PathVariable Long id) {

    userService.inactivateUser(id);
  }
}
