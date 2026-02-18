package com.portfolio.assetmanagement.application.asset.mapper;

import com.portfolio.assetmanagement.application.asset.dto.AssetResponseDTO;
import com.portfolio.assetmanagement.domain.asset.entity.Asset;
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