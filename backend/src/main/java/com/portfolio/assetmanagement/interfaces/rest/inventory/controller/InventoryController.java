package com.portfolio.assetmanagement.interfaces.rest.inventory.controller;

import com.portfolio.assetmanagement.application.inventory.dto.InventoryCreateDTO;
import com.portfolio.assetmanagement.application.inventory.dto.InventoryResponseDTO;
import com.portfolio.assetmanagement.application.inventory.service.InventoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.*;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Inventory", description = "Gerenciamento de sessões de inventário organizacional")
@RestController
@RequestMapping("/inventory")
public class InventoryController {

  private final InventoryService service;

  public InventoryController(InventoryService service) {
    this.service = service;
  }

  /* ============================================================
   *  CRIAR INVENTÁRIO
   * ============================================================ */

  @Operation(
      summary = "Criar nova sessão de inventário",
      description =
          """
          Cria uma nova sessão de inventário vinculada a uma unidade organizacional.

          A sessão inicia no status CREATED.
          Requer perfil ADMIN ou MANAGER.
          """)
  @ApiResponses({
    @ApiResponse(responseCode = "200", description = "Inventário criado com sucesso"),
    @ApiResponse(responseCode = "400", description = "Dados inválidos"),
    @ApiResponse(responseCode = "401", description = "Não autenticado"),
    @ApiResponse(responseCode = "403", description = "Sem permissão")
  })
  @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
  @PostMapping
  public InventoryResponseDTO create(@RequestBody @Valid InventoryCreateDTO dto) {

    if (dto.getUnitId() == null) {
      throw new IllegalArgumentException("unitId é obrigatório");
    }

    return service.create(dto.getUnitId());
  }

  /* ============================================================
   *  BUSCAR POR ID
   * ============================================================ */

  @Operation(
      summary = "Buscar sessão de inventário por ID",
      description = "Retorna detalhes completos da sessão de inventário.")
  @ApiResponses({
    @ApiResponse(responseCode = "200", description = "Inventário encontrado"),
    @ApiResponse(responseCode = "404", description = "Inventário não encontrado")
  })
  @PreAuthorize("hasAnyRole('ADMIN','MANAGER','OPERATOR')")
  @GetMapping("/{id}")
  public InventoryResponseDTO findById(
      @Parameter(description = "ID da sessão de inventário", example = "1") @PathVariable @NotNull
          Long id) {

    return service.findById(id);
  }

  /* ============================================================
   *  LISTAR INVENTÁRIOS
   * ============================================================ */

  @Operation(
      summary = "Listar sessões de inventário",
      description =
          """
          Lista todas as sessões de inventário da organização atual.
          Multi-tenant safe.
          """)
  @PreAuthorize("hasAnyRole('ADMIN','MANAGER','OPERATOR')")
  @GetMapping
  public List<InventoryResponseDTO> list() {
    return service.list();
  }

  /* ============================================================
   *  INICIAR INVENTÁRIO
   * ============================================================ */

  @Operation(
      summary = "Iniciar sessão de inventário",
      description =
          """
          Move o inventário para o status IN_PROGRESS.

          Só pode ser iniciado se estiver no status CREATED.
          """)
  @ApiResponses({
    @ApiResponse(responseCode = "200", description = "Inventário iniciado com sucesso"),
    @ApiResponse(responseCode = "409", description = "Transição de status inválida")
  })
  @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
  @PatchMapping("/{id}/start")
  public void start(
      @Parameter(description = "ID da sessão", example = "1") @PathVariable @NotNull Long id) {

    service.start(id);
  }

  /* ============================================================
   *  FECHAR INVENTÁRIO
   * ============================================================ */

  @Operation(
      summary = "Fechar sessão de inventário",
      description =
          """
          Finaliza a sessão de inventário.

          Só pode ser fechado se estiver no status IN_PROGRESS.
          """)
  @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
  @PatchMapping("/{id}/close")
  public void close(
      @Parameter(description = "ID da sessão", example = "1") @PathVariable @NotNull Long id) {

    service.close(id);
  }

  /* ============================================================
   *  CANCELAR INVENTÁRIO
   * ============================================================ */

  @Operation(
      summary = "Cancelar sessão de inventário",
      description =
          """
          Cancela a sessão de inventário.

          Não pode ser cancelado se já estiver fechado.
          """)
  @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
  @PatchMapping("/{id}/cancel")
  public void cancel(
      @Parameter(description = "ID da sessão", example = "1") @PathVariable @NotNull Long id) {

    service.cancel(id);
  }
}
