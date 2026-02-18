package com.portfolio.assetmanagement.interfaces.rest.inventory.controller;

import com.portfolio.assetmanagement.application.inventory.dto.InventoryCreateDTO;
import com.portfolio.assetmanagement.application.inventory.dto.InventoryResponseDTO;
import com.portfolio.assetmanagement.application.inventory.service.InventoryService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
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

  /** Cria nova sessão de inventário. */
  @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
  @PostMapping
  public InventoryResponseDTO create(@RequestBody @Valid InventoryCreateDTO dto) {

    if (dto.getUnitId() == null) {

      throw new IllegalArgumentException("unitId é obrigatório");
    }

    return service.create(dto.getUnitId());
  }

  /** Busca sessão por ID. */
  @PreAuthorize("hasAnyRole('ADMIN','MANAGER','OPERATOR')")
  @GetMapping("/{id}")
  public InventoryResponseDTO findById(@PathVariable @NotNull Long id) {

    return service.findById(id);
  }

  /** Lista sessões da organization. */
  @PreAuthorize("hasAnyRole('ADMIN','MANAGER','OPERATOR')")
  @GetMapping
  public List<InventoryResponseDTO> list() {

    return service.list();
  }

  /** Inicia sessão. */
  @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
  @PatchMapping("/{id}/start")
  public void start(@PathVariable @NotNull Long id) {

    service.start(id);
  }

  /** Fecha sessão. */
  @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
  @PatchMapping("/{id}/close")
  public void close(@PathVariable @NotNull Long id) {

    service.close(id);
  }

  /** Cancela sessão. */
  @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
  @PatchMapping("/{id}/cancel")
  public void cancel(@PathVariable @NotNull Long id) {

    service.cancel(id);
  }
}
