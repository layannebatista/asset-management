package com.portfolio.asset_management.asset.controller;

import com.portfolio.asset_management.asset.dto.AssetCreateDTO;
import com.portfolio.asset_management.asset.dto.AssetResponseDTO;
import com.portfolio.asset_management.asset.entity.Asset;
import com.portfolio.asset_management.asset.service.AssetService;
import com.portfolio.asset_management.organization.entity.Organization;
import com.portfolio.asset_management.organization.service.OrganizationService;
import com.portfolio.asset_management.unit.entity.Unit;
import com.portfolio.asset_management.unit.service.UnitService;
import com.portfolio.asset_management.user.entity.User;
import com.portfolio.asset_management.user.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Controller responsável pelos endpoints de gerenciamento de ativos.
 *
 * <p>Permite cadastrar, consultar, atribuir, transferir e desativar ativos.
 */
@RestController
@RequestMapping("/organizations/{organizationId}/assets")
public class AssetController {

  private final AssetService assetService;
  private final OrganizationService organizationService;
  private final UnitService unitService;
  private final UserService userService;

  public AssetController(
      AssetService assetService,
      OrganizationService organizationService,
      UnitService unitService,
      UserService userService) {

    this.assetService = assetService;
    this.organizationService = organizationService;
    this.unitService = unitService;
    this.userService = userService;
  }

  @PostMapping
  public ResponseEntity<AssetResponseDTO> createAsset(
      @PathVariable Long organizationId, @Valid @RequestBody AssetCreateDTO request) {

    Organization organization = organizationService.findById(organizationId);
    Unit unit = unitService.findById(request.getUnitId());

    Asset asset =
        assetService.createAsset(
            request.getAssetTag(), request.getType(), request.getModel(), organization, unit);

    AssetResponseDTO response = mapToResponse(asset);

    return ResponseEntity.status(HttpStatus.CREATED).body(response);
  }

  @GetMapping("/{assetId}")
  public ResponseEntity<AssetResponseDTO> getAsset(@PathVariable Long assetId) {

    Asset asset = assetService.findById(assetId);
    AssetResponseDTO response = mapToResponse(asset);

    return ResponseEntity.ok(response);
  }

  @PatchMapping("/{assetId}/assign/{userId}")
  public ResponseEntity<Void> assignAssetToUser(
      @PathVariable Long assetId, @PathVariable Long userId) {

    User user = userService.findById(userId);
    assetService.assignAssetToUser(assetId, user);

    return ResponseEntity.noContent().build();
  }

  @PatchMapping("/{assetId}/unassign")
  public ResponseEntity<Void> unassignAssetFromUser(@PathVariable Long assetId) {

    assetService.unassignAssetFromUser(assetId);
    return ResponseEntity.noContent().build();
  }

  @PatchMapping("/{assetId}/transfer/{unitId}")
  public ResponseEntity<Void> transferAsset(@PathVariable Long assetId, @PathVariable Long unitId) {

    Unit newUnit = unitService.findById(unitId);
    assetService.changeAssetUnit(assetId, newUnit);

    return ResponseEntity.noContent().build();
  }

  @PatchMapping("/{assetId}/retire")
  public ResponseEntity<Void> retireAsset(@PathVariable Long assetId) {

    assetService.retireAsset(assetId);
    return ResponseEntity.noContent().build();
  }

  private AssetResponseDTO mapToResponse(Asset asset) {
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
