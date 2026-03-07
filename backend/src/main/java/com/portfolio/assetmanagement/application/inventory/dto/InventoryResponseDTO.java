package com.portfolio.assetmanagement.application.inventory.dto;

import com.portfolio.assetmanagement.domain.inventory.enums.InventoryStatus;
import java.time.OffsetDateTime; // NC1: era LocalDateTime — tipo incompatível com InventorySession

// após C2

public class InventoryResponseDTO {

  private Long id;
  private Long unitId;
  private InventoryStatus status;
  private OffsetDateTime createdAt; // NC1
  private OffsetDateTime closedAt; // NC1

  public InventoryResponseDTO(
      Long id,
      Long unitId,
      InventoryStatus status,
      OffsetDateTime createdAt, // NC1
      OffsetDateTime closedAt) { // NC1

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

  public OffsetDateTime getCreatedAt() { // NC1
    return createdAt;
  }

  public OffsetDateTime getClosedAt() { // NC1
    return closedAt;
  }
}
