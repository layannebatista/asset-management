package com.portfolio.asset_management.organization.controller;

import com.portfolio.asset_management.organization.dto.OrganizationCreateDTO;
import com.portfolio.asset_management.organization.dto.OrganizationResponseDTO;
import com.portfolio.asset_management.organization.entity.Organization;
import com.portfolio.asset_management.organization.service.OrganizationService;
import jakarta.validation.Valid;
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
  public OrganizationResponseDTO create(@RequestBody @Valid OrganizationCreateDTO dto) {

    Organization organization = organizationService.createOrganization(dto.getName());

    return new OrganizationResponseDTO(
        organization.getId(), organization.getName(), organization.getStatus());
  }

  @PreAuthorize("hasRole('ADMIN')")
  @GetMapping("/{id}")
  public OrganizationResponseDTO findById(@PathVariable Long id) {

    Organization organization = organizationService.findById(id);

    return new OrganizationResponseDTO(
        organization.getId(), organization.getName(), organization.getStatus());
  }
}
