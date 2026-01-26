package com.portfolio.asset_management.api.controller;

import com.portfolio.asset_management.application.service.MaintenanceService;
import com.portfolio.asset_management.domain.maintenance.Maintenance;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/maintenances")
public class MaintenanceController {

  private final MaintenanceService maintenanceService;

  public MaintenanceController(MaintenanceService maintenanceService) {
    this.maintenanceService = maintenanceService;
  }

  /* ======================================================
  ABRIR MANUTENÇÃO
  ====================================================== */

  @PostMapping("/open")
  public ResponseEntity<Maintenance> openMaintenance(
      @RequestParam UUID assetId, @RequestParam String description, @RequestParam UUID openedBy) {
    Maintenance maintenance = maintenanceService.openMaintenance(assetId, description, openedBy);
    return ResponseEntity.ok(maintenance);
  }

  /* ======================================================
  INICIAR MANUTENÇÃO
  ====================================================== */

  @PostMapping("/{maintenanceId}/start")
  public ResponseEntity<Void> startMaintenance(@PathVariable UUID maintenanceId) {
    maintenanceService.startMaintenance(maintenanceId);
    return ResponseEntity.ok().build();
  }

  /* ======================================================
  FINALIZAR MANUTENÇÃO
  ====================================================== */

  @PostMapping("/{maintenanceId}/finish")
  public ResponseEntity<Void> finishMaintenance(
      @PathVariable UUID maintenanceId, @RequestParam UUID finishedBy) {
    maintenanceService.finishMaintenance(maintenanceId, finishedBy);
    return ResponseEntity.ok().build();
  }

  /* ======================================================
  CANCELAR MANUTENÇÃO
  ====================================================== */

  @PostMapping("/{maintenanceId}/cancel")
  public ResponseEntity<Void> cancelMaintenance(
      @PathVariable UUID maintenanceId,
      @RequestParam UUID canceledBy,
      @RequestParam String reason) {
    maintenanceService.cancelMaintenance(maintenanceId, canceledBy, reason);
    return ResponseEntity.ok().build();
  }
}
