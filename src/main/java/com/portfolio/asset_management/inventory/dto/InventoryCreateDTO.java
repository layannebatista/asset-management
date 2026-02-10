package com.portfolio.asset_management.inventory.dto;

import jakarta.validation.constraints.NotNull;

public class InventoryCreateDTO {

  @NotNull
  private Long unitId;

  public InventoryCreateDTO() {}

  public Long getUnitId() {
    return unitId;
  }

  public void setUnitId(Long unitId) {
    this.unitId = unitId;
  }
}
