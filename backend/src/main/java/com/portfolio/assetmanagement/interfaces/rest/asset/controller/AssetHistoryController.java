package com.portfolio.assetmanagement.interfaces.rest.asset.controller;

import com.portfolio.assetmanagement.domain.asset.entity.AssetAssignmentHistory;
import com.portfolio.assetmanagement.domain.asset.entity.AssetStatusHistory;
import com.portfolio.assetmanagement.infrastructure.persistence.asset.repository.AssetAssignmentHistoryRepository;
import com.portfolio.assetmanagement.infrastructure.persistence.asset.repository.AssetStatusHistoryRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.*;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@Tag(
    name = "Asset History",
    description = "Consulta de histórico de alterações de status e atribuição de ativos")
@RestController
@RequestMapping("/assets/{assetId}/history")
public class AssetHistoryController {

  private final AssetStatusHistoryRepository statusRepository;
  private final AssetAssignmentHistoryRepository assignmentRepository;

  public AssetHistoryController(
      AssetStatusHistoryRepository statusRepository,
      AssetAssignmentHistoryRepository assignmentRepository) {

    this.statusRepository = statusRepository;
    this.assignmentRepository = assignmentRepository;
  }

  /* ============================================================
   *  STATUS HISTORY
   * ============================================================ */

  @Operation(
      summary = "Listar histórico de status do ativo",
      description =
          """
          Retorna o histórico completo de mudanças de status de um ativo,
          ordenado da alteração mais recente para a mais antiga.

          Exemplos de mudanças:
          - AVAILABLE → ASSIGNED
          - ASSIGNED → MAINTENANCE
          - MAINTENANCE → AVAILABLE
          - AVAILABLE → RETIRED

          Endpoint restrito a ADMIN e MANAGER.
          """)
  @ApiResponses({
    @ApiResponse(responseCode = "200", description = "Histórico retornado com sucesso"),
    @ApiResponse(responseCode = "401", description = "Usuário não autenticado"),
    @ApiResponse(responseCode = "403", description = "Usuário sem permissão"),
    @ApiResponse(responseCode = "404", description = "Ativo não encontrado")
  })
  @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
  @GetMapping("/status")
  public List<AssetStatusHistory> getStatusHistory(
      @Parameter(description = "ID do ativo", example = "1") @PathVariable Long assetId) {

    return statusRepository.findByAssetIdOrderByChangedAtDesc(assetId);
  }

  /* ============================================================
   *  ASSIGNMENT HISTORY
   * ============================================================ */

  @Operation(
      summary = "Listar histórico de atribuições do ativo",
      description =
          """
          Retorna o histórico de atribuições de um ativo a usuários.

          Mostra quando o ativo foi:
          - Atribuído a um usuário
          - Removido de um usuário

          Ordenado da alteração mais recente para a mais antiga.
          Endpoint restrito a ADMIN e MANAGER.
          """)
  @ApiResponses({
    @ApiResponse(responseCode = "200", description = "Histórico retornado com sucesso"),
    @ApiResponse(responseCode = "401", description = "Usuário não autenticado"),
    @ApiResponse(responseCode = "403", description = "Usuário sem permissão"),
    @ApiResponse(responseCode = "404", description = "Ativo não encontrado")
  })
  @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
  @GetMapping("/assignment")
  public List<AssetAssignmentHistory> getAssignmentHistory(
      @Parameter(description = "ID do ativo", example = "1") @PathVariable Long assetId) {

    return assignmentRepository.findByAssetIdOrderByChangedAtDesc(assetId);
  }
}
