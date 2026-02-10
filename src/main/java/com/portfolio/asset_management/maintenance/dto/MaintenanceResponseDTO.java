package com.portfolio.asset_management.maintenance.dto;

import com.portfolio.asset_management.maintenance.entity.MaintenanceRecord;
import com.portfolio.asset_management.maintenance.enums.MaintenanceStatus;
import java.time.OffsetDateTime;

/**
 * DTO de resposta que representa um registro de manutenção.
 *
 * <p>Encapsula os dados necessários para consumo externo sem expor a entidade diretamente.
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

  public MaintenanceResponseDTO(MaintenanceRecord record) {

    this.id = record.getId();
    this.assetId = record.getAsset().getId();
    this.organizationId = record.getOrganizationId();
    this.unitId = record.getUnitId();
    this.requestedByUserId = record.getRequestedByUserId();
    this.startedByUserId = record.getStartedByUserId();
    this.completedByUserId = record.getCompletedByUserId();
    this.status = record.getStatus();
    this.description = record.getDescription();
    this.resolution = record.getResolution();
    this.createdAt = record.getCreatedAt();
    this.startedAt = record.getStartedAt();
    this.completedAt = record.getCompletedAt();
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
