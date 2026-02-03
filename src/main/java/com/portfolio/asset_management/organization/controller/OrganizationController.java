package com.portfolio.asset_management.organization.controller;

import com.portfolio.asset_management.organization.entity.Organization;
import com.portfolio.asset_management.organization.service.OrganizationService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/organizations")
public class OrganizationController {

  private final OrganizationService organizationService;

  public OrganizationController(OrganizationService organizationService) {
    this.organizationService = organizationService;
  }

  @PreAuthorize("hasRole('ADMIN')")
  @PostMapping
  public Organization create(@RequestBody String name) {
    return organizationService.createOrganization(name);
  }

  @PreAuthorize("hasRole('ADMIN')")
  @GetMapping("/{id}")
  public Organization findById(@PathVariable Long id) {
    return organizationService.findById(id);
  }
}
