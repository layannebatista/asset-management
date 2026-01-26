package com.portfolio.asset_management.api.controller;

import com.portfolio.asset_management.application.service.InventoryService;
import com.portfolio.asset_management.domain.inventory.InventoryCheck;
import com.portfolio.asset_management.domain.inventory.InventoryCheckResult;
import com.portfolio.asset_management.domain.inventory.InventoryCycle;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/inventories")
public class InventoryController {

    private final InventoryService inventoryService;

    public InventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    /* ======================================================
       ABRIR INVENTÁRIO
       ====================================================== */

    @PostMapping("/open")
    public ResponseEntity<InventoryCycle> openInventory(
            @RequestParam UUID unitId,
            @RequestParam UUID openedBy
    ) {
        InventoryCycle cycle = inventoryService.openInventory(unitId, openedBy);
        return ResponseEntity.ok(cycle);
    }

    /* ======================================================
       REGISTRAR CONFERÊNCIA DE ATIVO
       ====================================================== */

    @PostMapping("/{inventoryCycleId}/check")
    public ResponseEntity<InventoryCheck> checkAsset(
            @PathVariable UUID inventoryCycleId,
            @RequestParam UUID assetId,
            @RequestParam InventoryCheckResult result,
            @RequestParam UUID checkedBy,
            @RequestParam(required = false) String observation
    ) {
        InventoryCheck check = inventoryService.checkAsset(
                inventoryCycleId,
                assetId,
                result,
                checkedBy,
                observation
        );
        return ResponseEntity.ok(check);
    }

    /* ======================================================
       FECHAR INVENTÁRIO
       ====================================================== */

    @PostMapping("/{inventoryCycleId}/close")
    public ResponseEntity<Void> closeInventory(
            @PathVariable UUID inventoryCycleId,
            @RequestParam UUID closedBy
    ) {
        inventoryService.closeInventory(inventoryCycleId, closedBy);
        return ResponseEntity.ok().build();
    }
}
