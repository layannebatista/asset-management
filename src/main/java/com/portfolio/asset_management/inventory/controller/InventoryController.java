package com.portfolio.asset_management.inventory.controller;

import com.portfolio.asset_management.inventory.dto.InventoryCreateDTO;
import com.portfolio.asset_management.inventory.dto.InventoryResponseDTO;
import com.portfolio.asset_management.inventory.service.InventoryService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/inventory")
public class InventoryController {

  private final InventoryService service;

  public InventoryController(InventoryService service) {
    this.service = service;
  }

  @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
  @PostMapping
  public InventoryResponseDTO create(@RequestBody @Valid InventoryCreateDTO dto) {
    return service.create(dto.getUnitId());
  }

  @GetMapping("/{id}")
  public InventoryResponseDTO findById(@PathVariable Long id) {
    return service.findById(id);
  }

  @GetMapping
  public List<InventoryResponseDTO> list() {
    return service.list();
  }

  @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
  @PatchMapping("/{id}/start")
  public void start(@PathVariable Long id) {
    service.start(id);
  }

  @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
  @PatchMapping("/{id}/close")
  public void close(@PathVariable Long id) {
    service.close(id);
  }

  @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
  @PatchMapping("/{id}/cancel")
  public void cancel(@PathVariable Long id) {
    service.cancel(id);
  }
}
