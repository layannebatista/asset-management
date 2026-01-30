package com.portfolio.asset_management.unit.controller;

import com.portfolio.asset_management.organization.entity.Organization;
import com.portfolio.asset_management.organization.service.OrganizationService;
import com.portfolio.asset_management.unit.dto.UnitCreateDTO;
import com.portfolio.asset_management.unit.dto.UnitResponseDTO;
import com.portfolio.asset_management.unit.entity.Unit;
import com.portfolio.asset_management.unit.service.UnitService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Controller responsável pelos endpoints de gerenciamento de unidades (filiais).
 *
 * <p>Permite criar, consultar e alterar o status das unidades de uma organização.
 */
@RestController
@RequestMapping("/organizations/{organizationId}/units")
public class UnitController {

  private final UnitService unitService;
  private final OrganizationService organizationService;

  public UnitController(UnitService unitService, OrganizationService organizationService) {
    this.unitService = unitService;
    this.organizationService = organizationService;
  }

  @PostMapping
  public ResponseEntity<UnitResponseDTO> createUnit(
      @PathVariable Long organizationId, @Valid @RequestBody UnitCreateDTO request) {

    Organization organization = organizationService.findById(organizationId);
    Unit unit = unitService.createUnit(request.getName(), organization);

    UnitResponseDTO response =
        new UnitResponseDTO(unit.getId(), unit.getName(), unit.getStatus(), unit.isMainUnit());

    return ResponseEntity.status(HttpStatus.CREATED).body(response);
  }

  @GetMapping
  public ResponseEntity<List<UnitResponseDTO>> listUnits(@PathVariable Long organizationId) {

    Organization organization = organizationService.findById(organizationId);
    List<UnitResponseDTO> response =
        unitService.findByOrganization(organization).stream()
            .map(
                unit ->
                    new UnitResponseDTO(
                        unit.getId(), unit.getName(), unit.getStatus(), unit.isMainUnit()))
            .collect(Collectors.toList());

    return ResponseEntity.ok(response);
  }

  @PatchMapping("/{unitId}/inactivate")
  public ResponseEntity<Void> inactivateUnit(@PathVariable Long unitId) {
    unitService.inactivateUnit(unitId);
    return ResponseEntity.noContent().build();
  }

  @PatchMapping("/{unitId}/activate")
  public ResponseEntity<Void> activateUnit(@PathVariable Long unitId) {
    unitService.activateUnit(unitId);
    return ResponseEntity.noContent().build();
  }
}
