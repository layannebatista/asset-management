package com.portfolio.asset_management.asset.mapper;

import com.portfolio.asset_management.asset.dto.AssetResponseDTO;
import com.portfolio.asset_management.asset.entity.Asset;
import org.springframework.stereotype.Component;

/**
 * Mapper responsável por conversão entre Asset e DTOs.
 *
 * <p>Centraliza transformação e evita vazamento de entidades.
 */
@Component
public class AssetMapper {

  public AssetResponseDTO toResponseDTO(Asset asset) {

    if (asset == null) {
      return null;
    }

    Long assignedUserId = asset.getAssignedUser() != null ? asset.getAssignedUser().getId() : null;

    return new AssetResponseDTO(
        asset.getId(),
        asset.getAssetTag(),
        asset.getType(),
        asset.getModel(),
        asset.getStatus(),
        asset.getOrganization().getId(),
        asset.getUnit().getId(),
        assignedUserId);
  }
}
