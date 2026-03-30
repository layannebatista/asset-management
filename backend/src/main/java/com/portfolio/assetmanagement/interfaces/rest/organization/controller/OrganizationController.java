package com.portfolio.assetmanagement.interfaces.rest.organization.controller;

import com.portfolio.assetmanagement.application.organization.dto.OrganizationCreateDTO;
import com.portfolio.assetmanagement.application.organization.dto.OrganizationResponseDTO;
import com.portfolio.assetmanagement.application.organization.mapper.OrganizationMapper;
import com.portfolio.assetmanagement.application.organization.service.OrganizationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.*;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Organizations", description = "Gerenciamento de organizações")
@RestController
@RequestMapping("/organizations")
public class OrganizationController {

  private final OrganizationService organizationService;
  private final OrganizationMapper organizationMapper;

  public OrganizationController(
      OrganizationService organizationService, OrganizationMapper organizationMapper) {
    this.organizationService = organizationService;
    this.organizationMapper = organizationMapper;
  }

  @Operation(summary = "Listar todas as organizações")
  @PreAuthorize("hasRole('ADMIN')")
  @GetMapping
  public List<OrganizationResponseDTO> listAll() {
    return organizationService.listAll().stream()
        .map(organizationMapper::toResponseDTO)
        .collect(Collectors.toList());
  }

  @Operation(summary = "Buscar organização por ID")
  @PreAuthorize("hasRole('ADMIN')")
  @GetMapping("/{id}")
  public OrganizationResponseDTO findById(
      @Parameter(description = "ID da organização") @PathVariable Long id) {
    return organizationMapper.toResponseDTO(organizationService.findById(id));
  }

  @Operation(summary = "Criar nova organização")
  @PreAuthorize("hasRole('ADMIN')")
  @PostMapping
  public OrganizationResponseDTO create(@RequestBody @Valid OrganizationCreateDTO dto) {
    return organizationMapper.toResponseDTO(organizationService.createOrganization(dto.getName()));
  }

  @Operation(summary = "Atualizar nome da organização",
      description = "Atualiza o nome da organização. Único campo editável pelo frontend.")
  @PreAuthorize("hasRole('ADMIN')")
  @PatchMapping("/{id}")
  public OrganizationResponseDTO updateName(
      @Parameter(description = "ID da organização") @PathVariable Long id,
      @RequestBody Map<String, String> body) {
    String name = body.get("name");
    if (name == null || name.isBlank()) {
      throw new com.portfolio.assetmanagement.shared.exception.BusinessException(
          "Nome da organização é obrigatório");
    }
    return organizationMapper.toResponseDTO(organizationService.updateName(id, name.trim()));
  }

  @Operation(summary = "Ativar organização")
  @PreAuthorize("hasRole('ADMIN')")
  @PatchMapping("/{id}/activate")
  public void activate(@PathVariable Long id) {
    organizationService.activateOrganization(id);
  }

  @Operation(summary = "Inativar organização")
  @PreAuthorize("hasRole('ADMIN')")
  @PatchMapping("/{id}/inactivate")
  public void inactivate(@PathVariable Long id) {
    organizationService.inactivateOrganization(id);
  }
}
