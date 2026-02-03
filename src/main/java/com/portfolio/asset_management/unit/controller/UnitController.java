package com.portfolio.asset_management.unit.controller;

import com.portfolio.asset_management.organization.entity.Organization;
import com.portfolio.asset_management.unit.entity.Unit;
import com.portfolio.asset_management.unit.service.UnitService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/units")
public class UnitController {

  private final UnitService unitService;

  public UnitController(UnitService unitService) {
    this.unitService = unitService;
  }

  @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
  @PostMapping
  public Unit create(String name, Organization organization) {
    return unitService.createUnit(name, organization);
  }
}
