package com.portfolio.assetmanagement.application.inventory.mapper;

import com.portfolio.assetmanagement.application.inventory.dto.InventoryResponseDTO;
import com.portfolio.assetmanagement.domain.inventory.entity.InventorySession;
import org.springframework.stereotype.Component;

/**
 * Mapper responsável pela conversão entre InventorySession e DTOs.
 *
 * <p>Evita vazamento da entidade e centraliza a transformação.
 */
@Component
public class InventoryMapper {

  public InventoryResponseDTO toResponseDTO(InventorySession session) {

    if (session == null) {
      return null;
    }

    return new InventoryResponseDTO(
        session.getId(),
        session.getUnit().getId(),
        session.getStatus(),
        session.getCreatedAt(),
        session.getClosedAt());
  }
}
