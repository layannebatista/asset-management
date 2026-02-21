package com.portfolio.assetmanagement.interfaces.rest.unit.controller;

import com.portfolio.assetmanagement.application.organization.service.OrganizationService;
import com.portfolio.assetmanagement.application.unit.dto.UnitCreateDTO;
import com.portfolio.assetmanagement.application.unit.dto.UnitResponseDTO;
import com.portfolio.assetmanagement.application.unit.service.UnitService;
import com.portfolio.assetmanagement.domain.organization.entity.Organization;
import com.portfolio.assetmanagement.domain.unit.entity.Unit;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.*;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@Tag(
    name = "Units",
    description = "Gerenciamento de unidades organizacionais (subdivisão da Organization)")
@RestController
@RequestMapping("/units")
public class UnitController {

  private final UnitService unitService;
  private final OrganizationService organizationService;

  public UnitController(UnitService unitService, OrganizationService organizationService) {
    this.unitService = unitService;
    this.organizationService = organizationService;
  }

  /* ============================================================
   *  CRIAR UNIDADE
   * ============================================================ */

  @Operation(
      summary = "Criar nova unidade",
      description =
          """
          Cria uma nova unidade vinculada a uma organização.

          Regras:
          - A organização deve existir
          - A unidade será vinculada ao tenant informado
          - Acesso: ADMIN ou MANAGER
          """)
  @ApiResponses({
    @ApiResponse(responseCode = "200", description = "Unidade criada com sucesso"),
    @ApiResponse(responseCode = "404", description = "Organização não encontrada"),
    @ApiResponse(responseCode = "403", description = "Acesso negado")
  })
  @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
  @PostMapping("/{organizationId}")
  public UnitResponseDTO create(
      @Parameter(description = "ID da organização", example = "1") @PathVariable
          Long organizationId,
      @RequestBody @Valid UnitCreateDTO dto) {

    Organization organization = organizationService.findById(organizationId);

    Unit unit = unitService.createUnit(dto.getName(), organization);

    return toResponse(unit);
  }

  /* ============================================================
   *  LISTAR UNIDADES POR ORGANIZAÇÃO
   * ============================================================ */

  @Operation(
      summary = "Listar unidades da organização",
      description =
          """
          Retorna todas as unidades vinculadas à organização informada.

          Multi-tenant safe.
          """)
  @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
  @GetMapping("/{organizationId}")
  public List<UnitResponseDTO> listByOrganization(
      @Parameter(description = "ID da organização", example = "1") @PathVariable
          Long organizationId) {

    Organization organization = organizationService.findById(organizationId);

    return unitService.findByOrganization(organization).stream().map(this::toResponse).toList();
  }

  /* ============================================================
   *  BUSCAR UNIDADE POR ID
   * ============================================================ */

  @Operation(
      summary = "Buscar unidade por ID",
      description = "Retorna detalhes da unidade informada.")
  @ApiResponses({
    @ApiResponse(responseCode = "200", description = "Unidade encontrada"),
    @ApiResponse(responseCode = "404", description = "Unidade não encontrada")
  })
  @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
  @GetMapping("/unit/{id}")
  public UnitResponseDTO findById(
      @Parameter(description = "ID da unidade", example = "10") @PathVariable Long id) {

    Unit unit = unitService.findById(id);

    return toResponse(unit);
  }

  /* ============================================================
   *  ATIVAR UNIDADE
   * ============================================================ */

  @Operation(
      summary = "Ativar unidade",
      description =
          """
          Move a unidade para status ACTIVE.

          Unidades ativas podem receber ativos e participar de transferências.
          """)
  @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
  @PatchMapping("/{id}/activate")
  public void activate(
      @Parameter(description = "ID da unidade", example = "10") @PathVariable Long id) {

    unitService.activateUnit(id);
  }

  /* ============================================================
   *  INATIVAR UNIDADE
   * ============================================================ */

  @Operation(
      summary = "Inativar unidade",
      description =
          """
          Move a unidade para status INACTIVE.

          Unidades inativas não devem receber novos ativos.
          """)
  @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
  @PatchMapping("/{id}/inactivate")
  public void inactivate(
      @Parameter(description = "ID da unidade", example = "10") @PathVariable Long id) {

    unitService.inactivateUnit(id);
  }

  /* ============================================================
   *  MAPPER
   * ============================================================ */

  private UnitResponseDTO toResponse(Unit unit) {

    return new UnitResponseDTO(unit.getId(), unit.getName(), unit.getStatus(), unit.isMainUnit());
  }
}
