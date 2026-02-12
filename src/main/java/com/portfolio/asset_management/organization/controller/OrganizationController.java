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

  /** Cria nova organização. */
  @PreAuthorize("hasRole('ADMIN')")
  @PostMapping
  public OrganizationResponseDTO create(@RequestBody @Valid OrganizationCreateDTO dto) {

    Organization organization = organizationService.createOrganization(dto.getName());

    return toResponse(organization);
  }

  /** Busca organização por id. */
  @PreAuthorize("hasRole('ADMIN')")
  @GetMapping("/{id}")
  public OrganizationResponseDTO findById(@PathVariable Long id) {

    Organization organization = organizationService.findById(id);

    return toResponse(organization);
  }

  /** Ativa organização. */
  @PreAuthorize("hasRole('ADMIN')")
  @PatchMapping("/{id}/activate")
  public void activate(@PathVariable Long id) {

    organizationService.activateOrganization(id);
  }

  /** Inativa organização. */
  @PreAuthorize("hasRole('ADMIN')")
  @PatchMapping("/{id}/inactivate")
  public void inactivate(@PathVariable Long id) {

    organizationService.inactivateOrganization(id);
  }

  /** Mapper interno. */
  private OrganizationResponseDTO toResponse(Organization organization) {

    return new OrganizationResponseDTO(
        organization.getId(), organization.getName(), organization.getStatus());
  }
}
