package com.portfolio.assetmanagement.interfaces.rest.maintenance.controller;

import com.portfolio.assetmanagement.application.maintenance.dto.MaintenanceCreateDTO;
import com.portfolio.assetmanagement.application.maintenance.dto.MaintenanceResponseDTO;
import com.portfolio.assetmanagement.application.maintenance.mapper.MaintenanceMapper;
import com.portfolio.assetmanagement.application.maintenance.service.MaintenanceService;
import com.portfolio.assetmanagement.domain.maintenance.entity.MaintenanceRecord;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.*;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Maintenance", description = "Gerenciamento do ciclo de vida de manutenções de ativos")
@RestController
@RequestMapping("/api/maintenance")
public class MaintenanceController {

  private final MaintenanceService maintenanceService;
  private final MaintenanceMapper maintenanceMapper;

  public MaintenanceController(
      MaintenanceService maintenanceService, MaintenanceMapper maintenanceMapper) {

    this.maintenanceService = maintenanceService;
    this.maintenanceMapper = maintenanceMapper;
  }

  /* ============================================================
   *  CRIAR MANUTENÇÃO
   * ============================================================ */

  @Operation(
      summary = "Criar solicitação de manutenção",
      description =
          """
          Cria uma nova solicitação de manutenção para um ativo.

          Regras:
          - O ativo deve existir
          - O ativo não pode estar aposentado
          - A manutenção inicia no status OPEN
          """)
  @ApiResponses({
    @ApiResponse(responseCode = "201", description = "Manutenção criada com sucesso"),
    @ApiResponse(responseCode = "400", description = "Dados inválidos"),
    @ApiResponse(responseCode = "404", description = "Ativo não encontrado"),
    @ApiResponse(responseCode = "409", description = "Estado inválido do ativo")
  })
  @PostMapping
  public ResponseEntity<MaintenanceResponseDTO> create(@RequestBody MaintenanceCreateDTO request) {

    MaintenanceRecord record =
        maintenanceService.create(request.getAssetId(), request.getDescription());

    return ResponseEntity.status(201).body(maintenanceMapper.toResponseDTO(record));
  }

  /* ============================================================
   *  INICIAR MANUTENÇÃO
   * ============================================================ */

  @Operation(
      summary = "Iniciar manutenção",
      description =
          """
          Move a manutenção para o status IN_PROGRESS.

          Só pode ser iniciada se estiver no status OPEN.
          """)
  @ApiResponses({
    @ApiResponse(responseCode = "200", description = "Manutenção iniciada com sucesso"),
    @ApiResponse(responseCode = "404", description = "Manutenção não encontrada"),
    @ApiResponse(responseCode = "409", description = "Transição de status inválida")
  })
  @PostMapping("/{id}/start")
  public ResponseEntity<MaintenanceResponseDTO> start(
      @Parameter(description = "ID da manutenção", example = "1") @PathVariable Long id) {

    MaintenanceRecord record = maintenanceService.start(id);

    return ResponseEntity.ok(maintenanceMapper.toResponseDTO(record));
  }

  /* ============================================================
   *  CONCLUIR MANUTENÇÃO
   * ============================================================ */

  @Operation(
      summary = "Concluir manutenção",
      description =
          """
          Finaliza a manutenção.

          Regras:
          - Só pode ser concluída se estiver IN_PROGRESS
          - É obrigatório informar a resolução
          """)
  @ApiResponses({
    @ApiResponse(responseCode = "200", description = "Manutenção concluída com sucesso"),
    @ApiResponse(responseCode = "400", description = "Resolução não informada"),
    @ApiResponse(responseCode = "409", description = "Transição de status inválida")
  })
  @PostMapping("/{id}/complete")
  public ResponseEntity<MaintenanceResponseDTO> complete(
      @Parameter(description = "ID da manutenção", example = "1") @PathVariable Long id,
      @Parameter(description = "Descrição da resolução", example = "Troca da bateria") @RequestParam
          String resolution) {

    MaintenanceRecord record = maintenanceService.complete(id, resolution);

    return ResponseEntity.ok(maintenanceMapper.toResponseDTO(record));
  }

  /* ============================================================
   *  CANCELAR MANUTENÇÃO
   * ============================================================ */

  @Operation(
      summary = "Cancelar manutenção",
      description =
          """
          Cancela a manutenção.

          Não pode ser cancelada se já estiver concluída.
          """)
  @ApiResponses({
    @ApiResponse(responseCode = "200", description = "Manutenção cancelada com sucesso"),
    @ApiResponse(responseCode = "404", description = "Manutenção não encontrada"),
    @ApiResponse(responseCode = "409", description = "Estado inválido para cancelamento")
  })
  @PostMapping("/{id}/cancel")
  public ResponseEntity<MaintenanceResponseDTO> cancel(
      @Parameter(description = "ID da manutenção", example = "1") @PathVariable Long id) {

    MaintenanceRecord record = maintenanceService.cancel(id);

    return ResponseEntity.ok(maintenanceMapper.toResponseDTO(record));
  }
}
