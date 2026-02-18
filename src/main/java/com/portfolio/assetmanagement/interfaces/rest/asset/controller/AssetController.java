package com.portfolio.assetmanagement.interfaces.rest.asset.controller;

import com.portfolio.assetmanagement.application.asset.dto.AssetCreateDTO;
import com.portfolio.assetmanagement.application.asset.dto.AssetResponseDTO;
import com.portfolio.assetmanagement.application.asset.service.AssetService;
import com.portfolio.assetmanagement.application.organization.service.OrganizationService;
import com.portfolio.assetmanagement.application.unit.service.UnitService;
import com.portfolio.assetmanagement.domain.asset.entity.Asset;
import com.portfolio.assetmanagement.domain.organization.entity.Organization;
import com.portfolio.assetmanagement.domain.unit.entity.Unit;
import jakarta.validation.Valid;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/assets")
public class AssetController {

  private final AssetService assetService;

  private final OrganizationService organizationService;

  private final UnitService unitService;

  public AssetController(
      AssetService assetService, OrganizationService organizationService, UnitService unitService) {

    this.assetService = assetService;
    this.organizationService = organizationService;
    this.unitService = unitService;
  }

  @PreAuthorize("hasAnyRole('ADMIN','MANAGER','OPERATOR')")
  @GetMapping
  public List<AssetResponseDTO> list() {

    return assetService.findVisibleAssets().stream().map(this::map).collect(Collectors.toList());
  }

  @PreAuthorize("hasAnyRole('ADMIN','MANAGER','OPERATOR')")
  @GetMapping("/{id}")
  public AssetResponseDTO findById(@PathVariable Long id) {

    return map(assetService.findById(id));
  }

  /** Criação com assetTag manual. */
  @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
  @PostMapping("/{organizationId}")
  public AssetResponseDTO create(
      @PathVariable Long organizationId, @RequestBody @Valid AssetCreateDTO dto) {

    Organization organization = organizationService.findById(organizationId);

    Unit unit = unitService.findById(dto.getUnitId());

    Asset asset =
        assetService.createAsset(
            dto.getAssetTag(), dto.getType(), dto.getModel(), organization, unit);

    return map(asset);
  }

  /** Criação com assetTag automático. */
  @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
  @PostMapping("/{organizationId}/auto")
  public AssetResponseDTO createAutoTag(
      @PathVariable Long organizationId, @RequestBody @Valid AssetCreateDTO dto) {

    Organization organization = organizationService.findById(organizationId);

    Unit unit = unitService.findById(dto.getUnitId());

    Asset asset =
        assetService.createAssetAutoTag(dto.getType(), dto.getModel(), organization, unit);

    return map(asset);
  }

  @PreAuthorize("hasRole('ADMIN')")
  @PatchMapping("/{id}/retire")
  public void retire(@PathVariable Long id) {

    assetService.retireAsset(id);
  }

  @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
  @PatchMapping("/{assetId}/assign/{userId}")
  public void assign(@PathVariable Long assetId, @PathVariable Long userId) {

    assetService.assignAsset(assetId, userId);
  }

  @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
  @PatchMapping("/{assetId}/unassign")
  public void unassign(@PathVariable Long assetId) {

    assetService.unassignAsset(assetId);
  }

  private AssetResponseDTO map(Asset asset) {

    return new AssetResponseDTO(
        asset.getId(),
        asset.getAssetTag(),
        asset.getType(),
        asset.getModel(),
        asset.getStatus(),
        asset.getOrganization().getId(),
        asset.getUnit().getId(),
        asset.getAssignedUser() != null ? asset.getAssignedUser().getId() : null);
  }
}
