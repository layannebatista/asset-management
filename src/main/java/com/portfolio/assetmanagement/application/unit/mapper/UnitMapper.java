package com.portfolio.assetmanagement.application.unit.mapper;

import com.portfolio.assetmanagement.application.unit.dto.UnitResponseDTO;
import com.portfolio.assetmanagement.domain.unit.entity.Unit;
import org.springframework.stereotype.Component;

/**
 * Mapper responsável pela conversão entre Unit e DTOs.
 *
 * <p>Centraliza a transformação e evita vazamento da entidade.
 */
@Component
public class UnitMapper {

  public UnitResponseDTO toResponseDTO(Unit unit) {

    if (unit == null) {
      return null;
    }

    return new UnitResponseDTO(unit.getId(), unit.getName(), unit.getStatus(), unit.isMainUnit());
  }
}
