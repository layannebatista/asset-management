package com.portfolio.asset_management.api.controller;

import com.portfolio.asset_management.application.service.InventoryService;
import com.portfolio.asset_management.domain.inventory.InventoryCheckResult;
import com.portfolio.asset_management.domain.inventory.InventoryCycle;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

/**
 * Controller REST do módulo Inventory.
 *
 * <p>Responsável apenas por expor o processo de inventário via HTTP.
 *
 * <p>NÃO contém regra de negócio. NÃO altera domínio diretamente.
 *
 * <p>Preparado para: - Rest Assured - BDD - Testes de integração
 */
@RestController
@RequestMapping("/inventory-cycles")
public class InventoryController {

  private final InventoryService inventoryService;

  public InventoryController(InventoryService inventoryService) {
    this.inventoryService = inventoryService;
  }

  /* ======================================================
  INICIAR CICLO DE INVENTÁRIO
  ====================================================== */

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public InventoryCycle iniciarCiclo() {
    return inventoryService.iniciarCiclo();
  }

  /* ======================================================
  ADICIONAR ATIVO AO CICLO
  ====================================================== */

  @PostMapping("/{cycleId}/items")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void adicionarAtivo(@PathVariable UUID cycleId, @RequestParam UUID assetId) {

    inventoryService.adicionarAtivoAoCiclo(cycleId, assetId);
  }

  /* ======================================================
  REGISTRAR CHECK DE INVENTÁRIO
  ====================================================== */

  @PostMapping("/{cycleId}/checks")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void registrarCheck(
      @PathVariable UUID cycleId,
      @RequestParam UUID assetId,
      @RequestParam InventoryCheckResult result,
      @RequestParam UUID checkedBy) {

    inventoryService.registrarCheck(cycleId, assetId, result, checkedBy);
  }

  /* ======================================================
  FECHAR CICLO DE INVENTÁRIO
  ====================================================== */

  @PostMapping("/{cycleId}/close")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void fecharCiclo(@PathVariable UUID cycleId, @RequestParam UUID closedBy) {

    inventoryService.fecharCiclo(cycleId, closedBy);
  }
}
