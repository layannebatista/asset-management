package com.portfolio.asset_management.unit.mapper;

import com.portfolio.asset_management.unit.dto.UnitResponseDTO;
import com.portfolio.asset_management.unit.entity.Unit;
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
