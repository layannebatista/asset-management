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

  @Operation(summary = "Criar nova sessão de inventário")
  @ApiResponses({
    @ApiResponse(responseCode = "200", description = "Inventário criado com sucesso"),
    @ApiResponse(responseCode = "400", description = "Dados inválidos"),
    @ApiResponse(responseCode = "401", description = "Não autenticado"),
    @ApiResponse(responseCode = "403", description = "Sem permissão")
  })
  @PreAuthorize("hasAnyRole('ADMIN','GESTOR')")
  @PostMapping
  public InventoryResponseDTO create(@RequestBody @Valid InventoryCreateDTO dto) {
    // M7: removido if (dto.getUnitId() == null) — InventoryCreateDTO já tem @NotNull
    // no campo unitId, e @Valid acima garante a validação antes de chegar aqui.
    return service.create(dto.getUnitId());
  }

  @Operation(summary = "Buscar sessão de inventário por ID")
  @ApiResponses({
    @ApiResponse(responseCode = "200", description = "Inventário encontrado"),
    @ApiResponse(responseCode = "404", description = "Inventário não encontrado")
  })
  @PreAuthorize("hasAnyRole('ADMIN','GESTOR','OPERADOR')")
  @GetMapping("/{id}")
  public InventoryResponseDTO findById(
      @Parameter(description = "ID da sessão de inventário", example = "1") @PathVariable @NotNull
          Long id) {
    return service.findById(id);
  }

  @Operation(summary = "Listar sessões de inventário")
  @PreAuthorize("hasAnyRole('ADMIN','GESTOR','OPERADOR')")
  @GetMapping
  public List<InventoryResponseDTO> list() {
    return service.list();
  }

  @Operation(summary = "Iniciar sessão de inventário")
  @ApiResponses({
    @ApiResponse(responseCode = "200", description = "Inventário iniciado com sucesso"),
    @ApiResponse(responseCode = "409", description = "Transição de status inválida")
  })
  @PreAuthorize("hasAnyRole('ADMIN','GESTOR')")
  @PatchMapping("/{id}/start")
  public void start(
      @Parameter(description = "ID da sessão", example = "1") @PathVariable @NotNull Long id) {
    service.start(id);
  }

  @Operation(summary = "Fechar sessão de inventário")
  @PreAuthorize("hasAnyRole('ADMIN','GESTOR')")
  @PatchMapping("/{id}/close")
  public void close(
      @Parameter(description = "ID da sessão", example = "1") @PathVariable @NotNull Long id) {
    service.close(id);
  }

  @Operation(summary = "Cancelar sessão de inventário")
  @PreAuthorize("hasAnyRole('ADMIN','GESTOR')")
  @PatchMapping("/{id}/cancel")
  public void cancel(
      @Parameter(description = "ID da sessão", example = "1") @PathVariable @NotNull Long id) {
    service.cancel(id);
  }
}
