package com.portfolio.asset_management.unit.controller;

import com.portfolio.asset_management.organization.entity.Organization;
import com.portfolio.asset_management.organization.service.OrganizationService;
import com.portfolio.asset_management.unit.dto.UnitCreateDTO;
import com.portfolio.asset_management.unit.dto.UnitResponseDTO;
import com.portfolio.asset_management.unit.entity.Unit;
import com.portfolio.asset_management.unit.service.UnitService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/units")
public class UnitController {

  private final UnitService unitService;
  private final OrganizationService organizationService;

  public UnitController(UnitService unitService, OrganizationService organizationService) {

    this.unitService = unitService;
    this.organizationService = organizationService;
  }

  /** Cria nova unidade. */
  @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
  @PostMapping("/{organizationId}")
  public UnitResponseDTO create(
      @PathVariable Long organizationId, @RequestBody @Valid UnitCreateDTO dto) {

    Organization organization = organizationService.findById(organizationId);

    Unit unit = unitService.createUnit(dto.getName(), organization);

    return toResponse(unit);
  }

  /** Lista unidades da organização. */
  @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
  @GetMapping("/{organizationId}")
  public List<UnitResponseDTO> listByOrganization(@PathVariable Long organizationId) {

    Organization organization = organizationService.findById(organizationId);

    return unitService.findByOrganization(organization).stream().map(this::toResponse).toList();
  }

  /** Busca unidade por id. */
  @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
  @GetMapping("/unit/{id}")
  public UnitResponseDTO findById(@PathVariable Long id) {

    Unit unit = unitService.findById(id);

    return toResponse(unit);
  }

  /** Ativa unidade. */
  @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
  @PatchMapping("/{id}/activate")
  public void activate(@PathVariable Long id) {

    unitService.activateUnit(id);
  }

  /** Inativa unidade. */
  @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
  @PatchMapping("/{id}/inactivate")
  public void inactivate(@PathVariable Long id) {

    unitService.inactivateUnit(id);
  }

  /** Mapper interno. */
  private UnitResponseDTO toResponse(Unit unit) {

    return new UnitResponseDTO(unit.getId(), unit.getName(), unit.getStatus(), unit.isMainUnit());
  }
}
