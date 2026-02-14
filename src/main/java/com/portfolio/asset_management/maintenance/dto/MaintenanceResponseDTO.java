package com.portfolio.asset_management.maintenance.dto;

import com.portfolio.asset_management.maintenance.enums.MaintenanceStatus;
import java.time.OffsetDateTime;

/**
 * DTO de resposta para manutenção.
 *
 * <p>Não depende da entidade.
 */
public class MaintenanceResponseDTO {

  private Long id;
  private Long assetId;
  private Long organizationId;
  private Long unitId;
  private Long requestedByUserId;
  private Long startedByUserId;
  private Long completedByUserId;
  private MaintenanceStatus status;
  private String description;
  private String resolution;
  private OffsetDateTime createdAt;
  private OffsetDateTime startedAt;
  private OffsetDateTime completedAt;

  public MaintenanceResponseDTO(
      Long id,
      Long assetId,
      Long organizationId,
      Long unitId,
      Long requestedByUserId,
      Long startedByUserId,
      Long completedByUserId,
      MaintenanceStatus status,
      String description,
      String resolution,
      OffsetDateTime createdAt,
      OffsetDateTime startedAt,
      OffsetDateTime completedAt) {

    this.id = id;
    this.assetId = assetId;
    this.organizationId = organizationId;
    this.unitId = unitId;
    this.requestedByUserId = requestedByUserId;
    this.startedByUserId = startedByUserId;
    this.completedByUserId = completedByUserId;
    this.status = status;
    this.description = description;
    this.resolution = resolution;
    this.createdAt = createdAt;
    this.startedAt = startedAt;
    this.completedAt = completedAt;
  }

  public Long getId() {
    return id;
  }

  public Long getAssetId() {
    return assetId;
  }

  public Long getOrganizationId() {
    return organizationId;
  }

  public Long getUnitId() {
    return unitId;
  }

  public Long getRequestedByUserId() {
    return requestedByUserId;
  }

  public Long getStartedByUserId() {
    return startedByUserId;
  }

  public Long getCompletedByUserId() {
    return completedByUserId;
  }

  public MaintenanceStatus getStatus() {
    return status;
  }

  public String getDescription() {
    return description;
  }

  public String getResolution() {
    return resolution;
  }

  public OffsetDateTime getCreatedAt() {
    return createdAt;
  }

  public OffsetDateTime getStartedAt() {
    return startedAt;
  }

  public OffsetDateTime getCompletedAt() {
    return completedAt;
  }
}
