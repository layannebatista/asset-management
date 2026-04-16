package com.portfolio.assetmanagement.interfaces.rest.maintenance.controller;

import com.portfolio.assetmanagement.application.maintenance.dto.MaintenanceBudgetDTO;
import com.portfolio.assetmanagement.application.maintenance.dto.MaintenanceCreateDTO;
import com.portfolio.assetmanagement.application.maintenance.dto.MaintenanceResponseDTO;
import jakarta.validation.Valid;
import com.portfolio.assetmanagement.application.maintenance.mapper.MaintenanceMapper;
import com.portfolio.assetmanagement.application.maintenance.service.MaintenanceQueryService;
import com.portfolio.assetmanagement.application.maintenance.service.MaintenanceService;
import com.portfolio.assetmanagement.domain.maintenance.entity.MaintenanceRecord;
import com.portfolio.assetmanagement.domain.maintenance.enums.MaintenanceStatus;
import com.portfolio.assetmanagement.shared.pagination.PageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.stream.Collectors;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Maintenance", description = "Gerenciamento do ciclo de vida de manutenções de ativos")
@RestController
@RequestMapping("/maintenance")
public class MaintenanceController {

  private final MaintenanceService maintenanceService;
  private final MaintenanceQueryService queryService;
  private final MaintenanceMapper maintenanceMapper;

  public MaintenanceController(
      MaintenanceService maintenanceService,
      MaintenanceQueryService queryService,
      MaintenanceMapper maintenanceMapper) {
    this.maintenanceService = maintenanceService;
    this.queryService = queryService;
    this.maintenanceMapper = maintenanceMapper;
  }

  @Operation(
      summary = "Listar manutenções",
      description =
          """
      Lista manutenções com filtros opcionais e paginação.
      Suporta filtros: status, assetId, unitId, requestedByUserId, startDate, endDate.
      ADMIN vê tudo; GESTOR vê sua unidade; OPERADOR vê seus ativos.
      """)
  @GetMapping
  public PageResponse<MaintenanceResponseDTO> list(
      @Parameter(description = "Status da manutenção") @RequestParam(required = false)
          MaintenanceStatus status,
      @Parameter(description = "ID do ativo") @RequestParam(required = false) Long assetId,
      @Parameter(description = "ID da unidade") @RequestParam(required = false) Long unitId,
      @Parameter(description = "ID do usuário solicitante") @RequestParam(required = false)
          Long requestedByUserId,
      @Parameter(description = "Data início (yyyy-MM-dd)")
          @RequestParam(required = false)
          @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
          LocalDate startDate,
      @Parameter(description = "Data fim (yyyy-MM-dd)")
          @RequestParam(required = false)
          @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
          LocalDate endDate,
      @ParameterObject Pageable pageable) {

    Page<MaintenanceRecord> page =
        queryService.list(status, assetId, unitId, requestedByUserId, startDate, endDate, pageable);

    return PageResponse.from(
        page,
        page.getContent().stream()
            .map(maintenanceMapper::toResponseDTO)
            .collect(Collectors.toList()));
  }

  @Operation(summary = "Relatório de orçamento de manutenção")
  @GetMapping("/budget")
  @PreAuthorize("hasAnyRole('ADMIN','GESTOR')")
  public ResponseEntity<MaintenanceBudgetDTO> budget(
      @RequestParam(required = false) Long unitId,
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
          LocalDate startDate,
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
          LocalDate endDate) {
    return ResponseEntity.ok(queryService.getBudgetReport(unitId, startDate, endDate));
  }

  @PreAuthorize("hasAnyRole('ADMIN','GESTOR')")
  @PostMapping
  public ResponseEntity<MaintenanceResponseDTO> create(@RequestBody @Valid MaintenanceCreateDTO request) {
    MaintenanceRecord record =
        maintenanceService.create(
            request.getAssetId(), request.getDescription(), request.getEstimatedCost());
    return ResponseEntity.status(201).body(maintenanceMapper.toResponseDTO(record));
  }

  @PreAuthorize("hasAnyRole('ADMIN','GESTOR','OPERADOR')")
  @PostMapping("/{id}/start")
  public ResponseEntity<MaintenanceResponseDTO> start(@PathVariable Long id) {
    return ResponseEntity.ok(maintenanceMapper.toResponseDTO(maintenanceService.start(id)));
  }

  @PreAuthorize("hasAnyRole('ADMIN','GESTOR','OPERADOR')")
  @PostMapping("/{id}/complete")
  public ResponseEntity<MaintenanceResponseDTO> complete(
      @PathVariable Long id,
      @RequestParam String resolution,
      @RequestParam(required = false) BigDecimal actualCost) {
    return ResponseEntity.ok(
        maintenanceMapper.toResponseDTO(maintenanceService.complete(id, resolution, actualCost)));
  }

  @PreAuthorize("hasAnyRole('ADMIN','GESTOR')")
  @PostMapping("/{id}/cancel")
  public ResponseEntity<MaintenanceResponseDTO> cancel(@PathVariable Long id) {
    return ResponseEntity.ok(maintenanceMapper.toResponseDTO(maintenanceService.cancel(id)));
  }
}
