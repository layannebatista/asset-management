package com.portfolio.asset_management.unit.controller;

import com.portfolio.asset_management.organization.entity.Organization;
import com.portfolio.asset_management.organization.service.OrganizationService;
import com.portfolio.asset_management.unit.dto.UnitCreateDTO;
import com.portfolio.asset_management.unit.dto.UnitResponseDTO;
import com.portfolio.asset_management.unit.entity.Unit;
import com.portfolio.asset_management.unit.service.UnitService;
import jakarta.validation.Valid;
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

  @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
  @PostMapping("/{organizationId}")
  public UnitResponseDTO create(
      @PathVariable Long organizationId, @RequestBody @Valid UnitCreateDTO dto) {

    Organization organization = organizationService.findById(organizationId);

    Unit unit = unitService.createUnit(dto.getName(), organization);

    return new UnitResponseDTO(unit.getId(), unit.getName(), unit.getStatus(), unit.isMainUnit());
  }
}
