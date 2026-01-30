package com.portfolio.asset_management.api.controller;

import com.portfolio.asset_management.application.service.MaintenanceService;
import com.portfolio.asset_management.domain.maintenance.MaintenanceRequest;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

/**
 * Controller REST do módulo de Manutenção.
 *
 * <p>Expõe endpoints semânticos alinhados ao processo de negócio. Nenhuma regra de negócio deve
 * existir aqui.
 *
 * <p>Preparado para: - Rest Assured - BDD - Testes de integração
 */
@RestController
@RequestMapping("/maintenance-requests")
public class MaintenanceController {

  private final MaintenanceService maintenanceService;

  public MaintenanceController(MaintenanceService maintenanceService) {
    this.maintenanceService = maintenanceService;
  }

  /* ======================================================
  CRIAR SOLICITAÇÃO DE MANUTENÇÃO
  ====================================================== */

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public MaintenanceRequest criarSolicitacao(
      @RequestParam UUID assetId, @RequestParam UUID requestedBy) {

    return maintenanceService.criarSolicitacao(assetId, requestedBy);
  }

  /* ======================================================
  INICIAR MANUTENÇÃO
  ====================================================== */

  @PostMapping("/{requestId}/iniciar")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void iniciarManutencao(@PathVariable UUID requestId, @RequestParam UUID triggeredBy) {

    maintenanceService.iniciarManutencao(requestId, triggeredBy);
  }

  /* ======================================================
  FINALIZAR MANUTENÇÃO
  ====================================================== */

  @PostMapping("/{requestId}/finalizar")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void finalizarManutencao(@PathVariable UUID requestId, @RequestParam UUID triggeredBy) {

    maintenanceService.finalizarManutencao(requestId, triggeredBy);
  }

  /* ======================================================
  CANCELAR MANUTENÇÃO
  ====================================================== */

  @PostMapping("/{requestId}/cancelar")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void cancelarManutencao(
      @PathVariable UUID requestId, @RequestParam UUID triggeredBy, @RequestParam String reason) {

    maintenanceService.cancelarManutencao(requestId, triggeredBy, reason);
  }

  /* ======================================================
  CONSULTAS
  ====================================================== */

  @GetMapping("/{requestId}")
  public MaintenanceRequest buscarPorId(@PathVariable UUID requestId) {

    return maintenanceService.buscarPorId(requestId);
  }

  @GetMapping
  public List<MaintenanceRequest> listarPorAsset(@RequestParam UUID assetId) {

    return maintenanceService.listarPorAsset(assetId);
  }
}
