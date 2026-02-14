package com.portfolio.asset_management.maintenance.controller;

import com.portfolio.asset_management.maintenance.dto.MaintenanceCreateDTO;
import com.portfolio.asset_management.maintenance.dto.MaintenanceResponseDTO;
import com.portfolio.asset_management.maintenance.entity.MaintenanceRecord;
import com.portfolio.asset_management.maintenance.mapper.MaintenanceMapper;
import com.portfolio.asset_management.maintenance.service.MaintenanceService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Controller responsável por expor endpoints de manutenção.
 *
 * <p>Usa mapper para evitar acoplamento com entidade.
 */
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

  /** Cria uma nova solicitação de manutenção. */
  @PostMapping
  public ResponseEntity<MaintenanceResponseDTO> create(@RequestBody MaintenanceCreateDTO request) {

    MaintenanceRecord record =
        maintenanceService.create(request.getAssetId(), request.getDescription());

    return ResponseEntity.status(201).body(maintenanceMapper.toResponseDTO(record));
  }

  /** Inicia manutenção. */
  @PostMapping("/{id}/start")
  public ResponseEntity<MaintenanceResponseDTO> start(@PathVariable Long id) {

    MaintenanceRecord record = maintenanceService.start(id);

    return ResponseEntity.ok(maintenanceMapper.toResponseDTO(record));
  }

  /** Conclui manutenção. */
  @PostMapping("/{id}/complete")
  public ResponseEntity<MaintenanceResponseDTO> complete(
      @PathVariable Long id, @RequestParam String resolution) {

    MaintenanceRecord record = maintenanceService.complete(id, resolution);

    return ResponseEntity.ok(maintenanceMapper.toResponseDTO(record));
  }

  /** Cancela manutenção. */
  @PostMapping("/{id}/cancel")
  public ResponseEntity<MaintenanceResponseDTO> cancel(@PathVariable Long id) {

    MaintenanceRecord record = maintenanceService.cancel(id);

    return ResponseEntity.ok(maintenanceMapper.toResponseDTO(record));
  }
}
