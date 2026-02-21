package com.portfolio.assetmanagement.interfaces.rest.organization.controller;

import com.portfolio.assetmanagement.application.organization.dto.OrganizationCreateDTO;
import com.portfolio.assetmanagement.application.organization.dto.OrganizationResponseDTO;
import com.portfolio.assetmanagement.application.organization.service.OrganizationService;
import com.portfolio.assetmanagement.domain.organization.entity.Organization;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.*;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@Tag(
    name = "Organizations",
    description = "Gerenciamento de organizações (multi-tenant root entity)")
@RestController
@RequestMapping("/organizations")
public class OrganizationController {

  private final OrganizationService organizationService;

  public OrganizationController(OrganizationService organizationService) {
    this.organizationService = organizationService;
  }

  /* ============================================================
   *  CRIAR ORGANIZAÇÃO
   * ============================================================ */

  @Operation(
      summary = "Criar nova organização",
      description =
          """
          Cria uma nova organização no sistema.

          A organização é a entidade raiz do modelo multi-tenant.
          Apenas usuários com perfil ADMIN podem executar.
          """)
  @ApiResponses({
    @ApiResponse(responseCode = "200", description = "Organização criada com sucesso"),
    @ApiResponse(responseCode = "400", description = "Dados inválidos"),
    @ApiResponse(responseCode = "401", description = "Usuário não autenticado"),
    @ApiResponse(responseCode = "403", description = "Usuário sem permissão")
  })
  @PreAuthorize("hasRole('ADMIN')")
  @PostMapping
  public OrganizationResponseDTO create(@RequestBody @Valid OrganizationCreateDTO dto) {

    Organization organization = organizationService.createOrganization(dto.getName());

    return toResponse(organization);
  }

  /* ============================================================
   *  BUSCAR ORGANIZAÇÃO
   * ============================================================ */

  @Operation(
      summary = "Buscar organização por ID",
      description = "Retorna detalhes da organização informada.")
  @ApiResponses({
    @ApiResponse(responseCode = "200", description = "Organização encontrada"),
    @ApiResponse(responseCode = "404", description = "Organização não encontrada"),
    @ApiResponse(responseCode = "403", description = "Acesso restrito ao ADMIN")
  })
  @PreAuthorize("hasRole('ADMIN')")
  @GetMapping("/{id}")
  public OrganizationResponseDTO findById(
      @Parameter(description = "ID da organização", example = "1") @PathVariable Long id) {

    Organization organization = organizationService.findById(id);

    return toResponse(organization);
  }

  /* ============================================================
   *  ATIVAR ORGANIZAÇÃO
   * ============================================================ */

  @Operation(
      summary = "Ativar organização",
      description =
          """
          Move a organização para o status ACTIVE.

          Apenas ADMIN pode executar.
          """)
  @ApiResponses({
    @ApiResponse(responseCode = "200", description = "Organização ativada com sucesso"),
    @ApiResponse(responseCode = "404", description = "Organização não encontrada")
  })
  @PreAuthorize("hasRole('ADMIN')")
  @PatchMapping("/{id}/activate")
  public void activate(
      @Parameter(description = "ID da organização", example = "1") @PathVariable Long id) {

    organizationService.activateOrganization(id);
  }

  /* ============================================================
   *  INATIVAR ORGANIZAÇÃO
   * ============================================================ */

  @Operation(
      summary = "Inativar organização",
      description =
          """
          Move a organização para o status INACTIVE.

          Organizações inativas não devem permitir operações operacionais.
          Apenas ADMIN pode executar.
          """)
  @ApiResponses({
    @ApiResponse(responseCode = "200", description = "Organização inativada com sucesso"),
    @ApiResponse(responseCode = "404", description = "Organização não encontrada")
  })
  @PreAuthorize("hasRole('ADMIN')")
  @PatchMapping("/{id}/inactivate")
  public void inactivate(
      @Parameter(description = "ID da organização", example = "1") @PathVariable Long id) {

    organizationService.inactivateOrganization(id);
  }

  /* ============================================================
   *  MAPPER
   * ============================================================ */

  private OrganizationResponseDTO toResponse(Organization organization) {

    return new OrganizationResponseDTO(
        organization.getId(), organization.getName(), organization.getStatus());
  }
}
