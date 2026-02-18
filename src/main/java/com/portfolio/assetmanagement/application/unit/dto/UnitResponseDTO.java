package com.portfolio.assetmanagement.application.unit.dto;

import com.portfolio.assetmanagement.domain.unit.enums.UnitStatus;

/**
 * DTO responsável por representar a resposta de uma unidade (filial).
 *
 * <p>Define os dados expostos pela API sobre a unidade, evitando o vazamento de informações
 * internas da entidade.
 */
public class UnitResponseDTO {

  private Long id;
  private String name;
  private UnitStatus status;
  private boolean mainUnit;

  public UnitResponseDTO() {}

  public UnitResponseDTO(Long id, String name, UnitStatus status, boolean mainUnit) {
    this.id = id;
    this.name = name;
    this.status = status;
    this.mainUnit = mainUnit;
  }

  public Long getId() {
    return id;
  }

  public String getName() {
    return name;
  }

  public UnitStatus getStatus() {
    return status;
  }

  public boolean isMainUnit() {
    return mainUnit;
  }
}
