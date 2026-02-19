package com.portfolio.assetmanagement.interfaces.rest.asset.controller;

import com.portfolio.assetmanagement.application.asset.dto.AssetCreateDTO;
import com.portfolio.assetmanagement.application.asset.dto.AssetResponseDTO;
import com.portfolio.assetmanagement.application.asset.service.AssetService;
import com.portfolio.assetmanagement.application.organization.service.OrganizationService;
import com.portfolio.assetmanagement.application.unit.service.UnitService;
import com.portfolio.assetmanagement.domain.asset.entity.Asset;
import com.portfolio.assetmanagement.domain.asset.enums.AssetStatus;
import com.portfolio.assetmanagement.domain.asset.enums.AssetType;
import com.portfolio.assetmanagement.domain.organization.entity.Organization;
import com.portfolio.assetmanagement.domain.unit.entity.Unit;
import com.portfolio.assetmanagement.shared.pagination.PageResponse;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
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

  /* ============================================================
   *  LISTAGEM ENTERPRISE COM PAGINAÇÃO + FILTROS
   * ============================================================ */

  @PreAuthorize("hasAnyRole('ADMIN','MANAGER','OPERATOR')")
  @GetMapping
  public PageResponse<AssetResponseDTO> list(
      @RequestParam(required = false) AssetStatus status,
      @RequestParam(required = false) AssetType type,
      @RequestParam(required = false) Long unitId,
      @RequestParam(required = false) Long assignedUserId,
      @RequestParam(required = false) String assetTag,
      @RequestParam(required = false) String model,
      Pageable pageable) {

    return assetService.searchAssets(
        status, type, unitId, assignedUserId, assetTag, model, pageable);
  }

  /* ============================================================
   *  BUSCA POR ID
   * ============================================================ */

  @PreAuthorize("hasAnyRole('ADMIN','MANAGER','OPERATOR')")
  @GetMapping("/{id}")
  public AssetResponseDTO findById(@PathVariable Long id) {

    return map(assetService.findById(id));
  }

  /* ============================================================
   *  CRIAÇÃO MANUAL
   * ============================================================ */

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

  /* ============================================================
   *  CRIAÇÃO AUTOMÁTICA
   * ============================================================ */

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

  /* ============================================================
   *  RETIRE
   * ============================================================ */

  @PreAuthorize("hasRole('ADMIN')")
  @PatchMapping("/{id}/retire")
  public void retire(@PathVariable Long id) {

    assetService.retireAsset(id);
  }

  /* ============================================================
   *  ASSIGN
   * ============================================================ */

  @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
  @PatchMapping("/{assetId}/assign/{userId}")
  public void assign(@PathVariable Long assetId, @PathVariable Long userId) {

    assetService.assignAsset(assetId, userId);
  }

  /* ============================================================
   *  UNASSIGN
   * ============================================================ */

  @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
  @PatchMapping("/{assetId}/unassign")
  public void unassign(@PathVariable Long assetId) {

    assetService.unassignAsset(assetId);
  }

  /* ============================================================
   *  MAPPER
   * ============================================================ */

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
