package com.portfolio.asset_management.maintenance.controller;

import com.portfolio.asset_management.maintenance.dto.MaintenanceCreateDTO;
import com.portfolio.asset_management.maintenance.dto.MaintenanceResponseDTO;
import com.portfolio.asset_management.maintenance.entity.MaintenanceRecord;
import com.portfolio.asset_management.maintenance.service.MaintenanceService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/** Controller responsável por expor endpoints de manutenção. */
@RestController
@RequestMapping("/api/maintenance")
public class MaintenanceController {

  private final MaintenanceService maintenanceService;

  public MaintenanceController(MaintenanceService maintenanceService) {
    this.maintenanceService = maintenanceService;
  }

  /** Cria uma nova solicitação de manutenção. */
  @PostMapping
  public ResponseEntity<MaintenanceResponseDTO> create(@RequestBody MaintenanceCreateDTO request) {

    MaintenanceRecord record =
        maintenanceService.create(request.getAssetId(), request.getDescription());

    return ResponseEntity.status(201).body(new MaintenanceResponseDTO(record));
  }

  /** Inicia uma manutenção. */
  @PostMapping("/{id}/start")
  public ResponseEntity<MaintenanceResponseDTO> start(@PathVariable Long id) {

    MaintenanceRecord record = maintenanceService.start(id);

    return ResponseEntity.ok(new MaintenanceResponseDTO(record));
  }

  /** Conclui uma manutenção. */
  @PostMapping("/{id}/complete")
  public ResponseEntity<MaintenanceResponseDTO> complete(
      @PathVariable Long id, @RequestParam String resolution) {

    MaintenanceRecord record = maintenanceService.complete(id, resolution);

    return ResponseEntity.ok(new MaintenanceResponseDTO(record));
  }

  /** Cancela uma manutenção. */
  @PostMapping("/{id}/cancel")
  public ResponseEntity<MaintenanceResponseDTO> cancel(@PathVariable Long id) {

    MaintenanceRecord record = maintenanceService.cancel(id);

    return ResponseEntity.ok(new MaintenanceResponseDTO(record));
  }
}
