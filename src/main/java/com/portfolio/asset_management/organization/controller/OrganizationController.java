package com.portfolio.asset_management.organization.controller;

import com.portfolio.asset_management.organization.dto.OrganizationCreateDTO;
import com.portfolio.asset_management.organization.dto.OrganizationResponseDTO;
import com.portfolio.asset_management.organization.entity.Organization;
import com.portfolio.asset_management.organization.service.OrganizationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Controller responsável pelos endpoints de gerenciamento de organizações.
 *
 * <p>Expõe operações de criação, consulta e alteração de status das empresas (tenants) do sistema.
 */
@RestController
@RequestMapping("/organizations")
public class OrganizationController {

  private final OrganizationService organizationService;

  public OrganizationController(OrganizationService organizationService) {
    this.organizationService = organizationService;
  }

  @PostMapping
  public ResponseEntity<OrganizationResponseDTO> createOrganization(
      @Valid @RequestBody OrganizationCreateDTO request) {

    Organization organization = organizationService.createOrganization(request.getName());

    OrganizationResponseDTO response =
        new OrganizationResponseDTO(
            organization.getId(), organization.getName(), organization.getStatus());

    return ResponseEntity.status(HttpStatus.CREATED).body(response);
  }

  @GetMapping("/{id}")
  public ResponseEntity<OrganizationResponseDTO> getOrganization(@PathVariable Long id) {

    Organization organization = organizationService.findById(id);

    OrganizationResponseDTO response =
        new OrganizationResponseDTO(
            organization.getId(), organization.getName(), organization.getStatus());

    return ResponseEntity.ok(response);
  }

  @PatchMapping("/{id}/inactivate")
  public ResponseEntity<Void> inactivateOrganization(@PathVariable Long id) {
    organizationService.inactivateOrganization(id);
    return ResponseEntity.noContent().build();
  }

  @PatchMapping("/{id}/activate")
  public ResponseEntity<Void> activateOrganization(@PathVariable Long id) {
    organizationService.activateOrganization(id);
    return ResponseEntity.noContent().build();
  }
}
