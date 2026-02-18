package com.portfolio.assetmanagement.application.maintenance.mapper;

import com.portfolio.assetmanagement.application.maintenance.dto.MaintenanceResponseDTO;
import com.portfolio.assetmanagement.domain.maintenance.entity.MaintenanceRecord;
import org.springframework.stereotype.Component;

/**
 * Mapper responsável pela conversão entre MaintenanceRecord e DTO.
 *
 * <p>Evita acoplamento entre camada de domínio e camada de apresentação.
 */
@Component
public class MaintenanceMapper {

  public MaintenanceResponseDTO toResponseDTO(MaintenanceRecord record) {

    if (record == null) {
      return null;
    }

    return new MaintenanceResponseDTO(
        record.getId(),
        record.getAsset().getId(),
        record.getOrganizationId(),
        record.getUnitId(),
        record.getRequestedByUserId(),
        record.getStartedByUserId(),
        record.getCompletedByUserId(),
        record.getStatus(),
        record.getDescription(),
        record.getResolution(),
        record.getCreatedAt(),
        record.getStartedAt(),
        record.getCompletedAt());
  }
}