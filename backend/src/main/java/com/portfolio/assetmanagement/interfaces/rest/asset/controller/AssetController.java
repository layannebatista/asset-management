package com.portfolio.assetmanagement.interfaces.rest.asset.controller;

import com.portfolio.assetmanagement.application.asset.dto.AssetAutoCreateDTO;
import com.portfolio.assetmanagement.application.asset.dto.AssetCreateDTO;
import com.portfolio.assetmanagement.application.asset.dto.AssetResponseDTO;
import com.portfolio.assetmanagement.application.asset.mapper.AssetMapper;
import com.portfolio.assetmanagement.application.asset.service.AssetService;
import com.portfolio.assetmanagement.application.organization.service.OrganizationService;
import com.portfolio.assetmanagement.application.unit.service.UnitService;
import com.portfolio.assetmanagement.domain.asset.enums.AssetStatus;
import com.portfolio.assetmanagement.domain.asset.enums.AssetType;
import com.portfolio.assetmanagement.domain.organization.entity.Organization;
import com.portfolio.assetmanagement.domain.unit.entity.Unit;
import com.portfolio.assetmanagement.shared.pagination.PageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.*;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@Tag(
    name = "Assets",
    description = "Gerenciamento completo do ciclo de vida de ativos organizacionais")
@RestController
@RequestMapping("/assets")
public class AssetController {

  private final AssetService assetService;
  private final OrganizationService organizationService;
  private final UnitService unitService;
  private final AssetMapper assetMapper;

  public AssetController(
      AssetService assetService,
      OrganizationService organizationService,
      UnitService unitService,
      AssetMapper assetMapper) {

    this.assetService = assetService;
    this.organizationService = organizationService;
    this.unitService = unitService;
    this.assetMapper = assetMapper;
  }

  /* ============================================================
   *  LISTAGEM COM PAGINAÇÃO + FILTROS
   * ============================================================ */

  @Operation(
      summary = "Listar ativos",
      description =
          """
          Retorna uma lista paginada de ativos com filtros opcionais.

          Permite filtrar por:
          - status
          - tipo
          - unidade
          - usuário atribuído
          - assetTag
          - modelo

          Requer autenticação JWT.
          """)
  @ApiResponses({
    @ApiResponse(responseCode = "200", description = "Lista retornada com sucesso"),
    @ApiResponse(responseCode = "401", description = "Usuário não autenticado"),
    @ApiResponse(responseCode = "403", description = "Usuário sem permissão")
  })
  @PreAuthorize("hasAnyRole('ADMIN', 'GESTOR', 'OPERADOR')")
  @GetMapping
  public PageResponse<AssetResponseDTO> list(
      @Parameter(description = "Status do ativo", example = "AVAILABLE")
          @RequestParam(required = false)
          AssetStatus status,
      @Parameter(description = "Tipo do ativo", example = "NOTEBOOK")
          @RequestParam(required = false)
          AssetType type,
      @Parameter(description = "ID da unidade organizacional", example = "1")
          @RequestParam(required = false)
          Long unitId,
      @Parameter(description = "ID do usuário atribuído", example = "10")
          @RequestParam(required = false)
          Long assignedUserId,
      @Parameter(description = "Filtro por assetTag", example = "ASSET-001")
          @RequestParam(required = false)
          String assetTag,
      @Parameter(description = "Filtro por modelo", example = "Dell Latitude 5430")
          @RequestParam(required = false)
          String model,
      @ParameterObject Pageable pageable) {

    return assetService.searchAssets(
        status, type, unitId, assignedUserId, assetTag, model, pageable);
  }

  /* ============================================================
   *  BUSCA POR ID
   * ============================================================ */

  @Operation(summary = "Buscar ativo por ID")
  @ApiResponses({
    @ApiResponse(responseCode = "200", description = "Ativo encontrado"),
    @ApiResponse(responseCode = "404", description = "Ativo não encontrado"),
    @ApiResponse(responseCode = "401", description = "Não autenticado"),
    @ApiResponse(responseCode = "403", description = "Sem permissão")
  })
  @PreAuthorize("hasAnyRole('ADMIN', 'GESTOR', 'OPERADOR')")
  @GetMapping("/{id}")
  public AssetResponseDTO findById(
      @Parameter(description = "ID do ativo", example = "1") @PathVariable Long id) {

    return assetMapper.toResponseDTO(assetService.findById(id));
  }

  /* ============================================================
   *  CRIAÇÃO MANUAL
   * ============================================================ */

  @Operation(
      summary = "Criar ativo manualmente",
      description = "Cria um ativo informando explicitamente o assetTag.")
  @ApiResponses({
    @ApiResponse(responseCode = "201", description = "Ativo criado com sucesso"),
    @ApiResponse(responseCode = "400", description = "Dados inválidos"),
    @ApiResponse(responseCode = "409", description = "AssetTag já existente")
  })
  @PreAuthorize("hasAnyRole('ADMIN', 'GESTOR')")
  @PostMapping("/{organizationId}")
  public ResponseEntity<AssetResponseDTO> create(
      @Parameter(description = "ID da organização", example = "1") @PathVariable
          Long organizationId,
      @RequestBody @Valid AssetCreateDTO dto) {

    Organization organization = organizationService.findById(organizationId);
    Unit unit = unitService.findById(dto.getUnitId());

    AssetResponseDTO response =
        assetMapper.toResponseDTO(
            assetService.createAsset(
                dto.getAssetTag(), dto.getType(), dto.getModel(), organization, unit));

    return ResponseEntity.status(HttpStatus.CREATED).body(response);
  }

  /* ============================================================
   *  CRIAÇÃO AUTOMÁTICA
   * ============================================================ */

  @Operation(
      summary = "Criar ativo com assetTag automático",
      description = "Gera automaticamente o assetTag baseado na regra de negócio.")
  @ApiResponses({
    @ApiResponse(responseCode = "201", description = "Ativo criado com sucesso"),
    @ApiResponse(responseCode = "400", description = "Dados inválidos")
  })
  @PreAuthorize("hasAnyRole('ADMIN', 'GESTOR')")
  @PostMapping("/{organizationId}/auto")
  public ResponseEntity<AssetResponseDTO> createAutoTag(
      @PathVariable Long organizationId, @RequestBody @Valid AssetAutoCreateDTO dto) {

    Organization organization = organizationService.findById(organizationId);
    Unit unit = unitService.findById(dto.getUnitId());

    AssetResponseDTO response =
        assetMapper.toResponseDTO(
            assetService.createAssetAutoTag(dto.getType(), dto.getModel(), organization, unit));

    return ResponseEntity.status(HttpStatus.CREATED).body(response);
  }

  /* ============================================================
   *  RETIRE
   * ============================================================ */

  @Operation(
      summary = "Aposentar ativo",
      description = "Move o ativo para o status RETIRED. Apenas ADMIN pode executar.")
  @PreAuthorize("hasRole('ADMIN')")
  @PatchMapping("/{id}/retire")
  public void retire(@PathVariable Long id) {
    assetService.retireAsset(id);
  }

  /* ============================================================
   *  ASSIGN
   * ============================================================ */

  @Operation(
      summary = "Atribuir ativo a usuário",
      description = "Altera o status para ASSIGNED e vincula o usuário ao ativo.")
  @PreAuthorize("hasAnyRole('ADMIN', 'GESTOR')")
  @PatchMapping("/{assetId}/assign/{userId}")
  public void assign(@PathVariable Long assetId, @PathVariable Long userId) {
    assetService.assignAsset(assetId, userId);
  }

  /* ============================================================
   *  UNASSIGN
   * ============================================================ */

  @Operation(
      summary = "Remover atribuição de usuário",
      description = "Remove o usuário vinculado e retorna o ativo para AVAILABLE.")
  @PreAuthorize("hasAnyRole('ADMIN', 'GESTOR')")
  @PatchMapping("/{assetId}/unassign")
  public void unassign(@PathVariable Long assetId) {
    assetService.unassignAsset(assetId);
  }
}
