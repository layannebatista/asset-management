package com.portfolio.asset_management.asset.controller;

import com.portfolio.asset_management.asset.entity.Asset;
import com.portfolio.asset_management.asset.enums.AssetType;
import com.portfolio.asset_management.asset.service.AssetService;
import com.portfolio.asset_management.organization.entity.Organization;
import com.portfolio.asset_management.unit.entity.Unit;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Controller responsável pelos endpoints de ativos.
 *
 * <p>Regras: - ADMIN: acesso total - MANAGER: apenas ativos da própria unidade - OPERATOR: apenas
 * ativos atribuídos a ele
 *
 * <p>A visibilidade é controlada pelo ABAC no Service.
 */
@RestController
@RequestMapping("/assets")
public class AssetController {

  private final AssetService assetService;

  public AssetController(AssetService assetService) {
    this.assetService = assetService;
  }

  /**
   * Lista ativos visíveis para o usuário logado.
   *
   * <p>O filtro é aplicado no service via ABAC.
   */
  @PreAuthorize("hasAnyRole('ADMIN','MANAGER','OPERATOR')")
  @GetMapping
  public List<Asset> list() {
    return assetService.findVisibleAssets();
  }

  /** Busca ativo por id respeitando permissão. */
  @PreAuthorize("hasAnyRole('ADMIN','MANAGER','OPERATOR')")
  @GetMapping("/{id}")
  public Asset findById(@PathVariable Long id) {
    return assetService.findById(id);
  }

  /** Criação de ativo (somente ADMIN ou MANAGER). */
  @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
  @PostMapping
  public Asset create(
      @RequestParam String assetTag,
      @RequestParam AssetType type,
      @RequestParam String model,
      @RequestParam Organization organization,
      @RequestParam Unit unit) {

    return assetService.createAsset(assetTag, type, model, organization, unit);
  }

  /** Desativação definitiva de ativo (somente ADMIN). */
  @PreAuthorize("hasRole('ADMIN')")
  @PatchMapping("/{id}/retire")
  public void retire(@PathVariable Long id) {
    assetService.retireAsset(id);
  }
}
