package com.portfolio.asset_management.api.controller;

import com.portfolio.asset_management.application.service.AssetService;
import com.portfolio.asset_management.domain.asset.Asset;
import com.portfolio.asset_management.domain.asset.AssetStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/assets")
public class AssetController {

    private final AssetService assetService;

    public AssetController(AssetService assetService) {
        this.assetService = assetService;
    }

    /* ======================================================
       CRIAR ATIVO
       ====================================================== */

    @PostMapping
    public ResponseEntity<Asset> createAsset(
            @RequestParam String assetCode
    ) {
        Asset asset = assetService.createAsset(assetCode);
        return ResponseEntity.ok(asset);
    }

    /* ======================================================
       BUSCAR ATIVO POR ID
       ====================================================== */

    @GetMapping("/{id}")
    public ResponseEntity<Asset> getAssetById(@PathVariable UUID id) {
        Asset asset = assetService.getAssetById(id);
        return ResponseEntity.ok(asset);
    }

    /* ======================================================
       BUSCAR ATIVO POR CÓDIGO
       ====================================================== */

    @GetMapping("/by-code/{assetCode}")
    public ResponseEntity<Asset> getAssetByCode(@PathVariable String assetCode) {
        Asset asset = assetService.getAssetByCode(assetCode);
        return ResponseEntity.ok(asset);
    }

    /* ======================================================
       LISTAR ATIVOS POR STATUS
       ====================================================== */

    @GetMapping
    public ResponseEntity<List<Asset>> listAssetsByStatus(
            @RequestParam(required = false) AssetStatus status
    ) {
        List<Asset> assets = assetService.listAssets(status);
        return ResponseEntity.ok(assets);
    }
}
