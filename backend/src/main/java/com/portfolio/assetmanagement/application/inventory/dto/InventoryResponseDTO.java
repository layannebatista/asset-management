package com.portfolio.assetmanagement.application.inventory.dto;

import com.portfolio.assetmanagement.domain.inventory.enums.InventoryStatus;
import java.time.LocalDateTime;

public class InventoryResponseDTO {

  private Long id;
  private Long unitId;
  private InventoryStatus status;
  private LocalDateTime createdAt;
  private LocalDateTime closedAt;

  public InventoryResponseDTO(
      Long id,
      Long unitId,
      InventoryStatus status,
      LocalDateTime createdAt,
      LocalDateTime closedAt) {

    this.id = id;
    this.unitId = unitId;
    this.status = status;
    this.createdAt = createdAt;
    this.closedAt = closedAt;
  }

  public Long getId() {
    return id;
  }

  public Long getUnitId() {
    return unitId;
  }

  public InventoryStatus getStatus() {
    return status;
  }

  public LocalDateTime getCreatedAt() {
    return createdAt;
  }

  public LocalDateTime getClosedAt() {
    return closedAt;
  }
}
