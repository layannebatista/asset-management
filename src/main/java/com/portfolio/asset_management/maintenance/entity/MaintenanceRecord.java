package com.portfolio.asset_management.maintenance.entity;

import com.portfolio.asset_management.asset.entity.Asset;
import com.portfolio.asset_management.maintenance.enums.MaintenanceStatus;
import com.portfolio.asset_management.shared.exception.BusinessException;
import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(
    name = "maintenance_records",
    indexes = {
      @Index(name = "idx_maintenance_asset", columnList = "asset_id"),
      @Index(name = "idx_maintenance_org", columnList = "organization_id"),
      @Index(name = "idx_maintenance_status", columnList = "status")
    })
public class MaintenanceRecord {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  /**
   * Controle de concorrência otimista.
   *
   * <p>Evita:
   *
   * <p>- dois técnicos iniciarem ao mesmo tempo - duas conclusões simultâneas - cancelamento
   * concorrente
   */
  @Version
  @Column(nullable = false)
  private Long version;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "asset_id", nullable = false, updatable = false)
  private Asset asset;

  @Column(name = "organization_id", nullable = false, updatable = false)
  private Long organizationId;

  @Column(name = "unit_id", nullable = false, updatable = false)
  private Long unitId;

  @Column(name = "requested_by_user_id", nullable = false, updatable = false)
  private Long requestedByUserId;

  @Column(name = "started_by_user_id")
  private Long startedByUserId;

  @Column(name = "completed_by_user_id")
  private Long completedByUserId;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private MaintenanceStatus status;

  @Column(nullable = false, columnDefinition = "TEXT")
  private String description;

  @Column(columnDefinition = "TEXT")
  private String resolution;

  @Column(name = "created_at", nullable = false, updatable = false)
  private OffsetDateTime createdAt;

  @Column(name = "started_at")
  private OffsetDateTime startedAt;

  @Column(name = "completed_at")
  private OffsetDateTime completedAt;

  protected MaintenanceRecord() {}

  public MaintenanceRecord(
      Asset asset, Long organizationId, Long unitId, Long requestedByUserId, String description) {

    if (asset == null) {
      throw new IllegalArgumentException("asset é obrigatório");
    }

    if (organizationId == null) {
      throw new IllegalArgumentException("organizationId é obrigatório");
    }

    if (unitId == null) {
      throw new IllegalArgumentException("unitId é obrigatório");
    }

    if (requestedByUserId == null) {
      throw new IllegalArgumentException("requestedByUserId é obrigatório");
    }

    if (description == null || description.isBlank()) {
      throw new IllegalArgumentException("description é obrigatório");
    }

    if (!asset.getOrganization().getId().equals(organizationId)) {

      throw new BusinessException("Asset não pertence à organization");
    }

    if (!asset.getUnit().getId().equals(unitId)) {

      throw new BusinessException("Asset não pertence à unit");
    }

    this.asset = asset;
    this.organizationId = organizationId;
    this.unitId = unitId;
    this.requestedByUserId = requestedByUserId;
    this.description = description;
    this.status = MaintenanceStatus.REQUESTED;
    this.createdAt = OffsetDateTime.now();
  }

  public Long getId() {
    return id;
  }

  /** Usado automaticamente pelo Hibernate para controle de concorrência. */
  public Long getVersion() {
    return version;
  }

  public Asset getAsset() {
    return asset;
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

  public boolean isActive() {

    return status == MaintenanceStatus.REQUESTED || status == MaintenanceStatus.IN_PROGRESS;
  }

  public boolean isCompleted() {

    return status == MaintenanceStatus.COMPLETED;
  }

  public boolean isCancelled() {

    return status == MaintenanceStatus.CANCELLED;
  }

  public void start(Long userId) {

    if (status != MaintenanceStatus.REQUESTED) {

      throw new BusinessException("Somente manutenção REQUESTED pode ser iniciada");
    }

    if (userId == null) {

      throw new IllegalArgumentException("userId é obrigatório");
    }

    status = MaintenanceStatus.IN_PROGRESS;
    startedByUserId = userId;
    startedAt = OffsetDateTime.now();
  }

  public void complete(Long userId, String resolution) {

    if (status != MaintenanceStatus.IN_PROGRESS) {

      throw new BusinessException("Somente manutenção IN_PROGRESS pode ser concluída");
    }

    if (userId == null) {

      throw new IllegalArgumentException("userId é obrigatório");
    }

    if (resolution == null || resolution.isBlank()) {

      throw new IllegalArgumentException("resolution é obrigatório");
    }

    status = MaintenanceStatus.COMPLETED;
    completedByUserId = userId;
    completedAt = OffsetDateTime.now();
    this.resolution = resolution;
  }

  public void cancel() {

    if (status == MaintenanceStatus.COMPLETED) {

      throw new BusinessException("Manutenção concluída não pode ser cancelada");
    }

    if (status == MaintenanceStatus.CANCELLED) {

      throw new BusinessException("Manutenção já cancelada");
    }

    status = MaintenanceStatus.CANCELLED;
  }

  public void validateOwnership(Long organizationId) {

    if (!this.organizationId.equals(organizationId)) {

      throw new BusinessException("Manutenção não pertence à organization");
    }
  }
}
