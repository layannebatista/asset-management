package com.portfolio.asset_management.audit.entity;

import com.portfolio.asset_management.audit.enums.AuditEventType;
import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "audit_events")
public class AuditEvent {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private AuditEventType type;

  @Column(name = "actor_user_id")
  private Long actorUserId;

  @Column(name = "organization_id", nullable = false)
  private Long organizationId;

  @Column(name = "unit_id")
  private Long unitId;

  @Column(name = "target_id")
  private Long targetId;

  @Column(name = "target_type")
  private String targetType;

  @Column(columnDefinition = "TEXT")
  private String details;

  @Column(name = "created_at", nullable = false, updatable = false)
  private OffsetDateTime createdAt;

  protected AuditEvent() {}

  // NOVO construtor enterprise
  public AuditEvent(
      AuditEventType type,
      Long actorUserId,
      Long organizationId,
      Long unitId,
      Long targetId,
      String targetType,
      String details) {

    this.type = type;
    this.actorUserId = actorUserId;
    this.organizationId = organizationId;
    this.unitId = unitId;
    this.targetId = targetId;
    this.targetType = targetType;
    this.details = details;
    this.createdAt = OffsetDateTime.now();
  }

  // CONSTRUTOR LEGADO — ESSENCIAL PARA NÃO QUEBRAR SERVICES EXISTENTES
  public AuditEvent(
      AuditEventType type,
      Long actorUserId,
      Long organizationId,
      Long unitId,
      Long targetId,
      String details) {

    this.type = type;
    this.actorUserId = actorUserId;
    this.organizationId = organizationId;
    this.unitId = unitId;
    this.targetId = targetId;
    this.targetType = null;
    this.details = details;
    this.createdAt = OffsetDateTime.now();
  }

  @PrePersist
  protected void onCreate() {
    if (this.createdAt == null) {
      this.createdAt = OffsetDateTime.now();
    }
  }

  public Long getId() {
    return id;
  }

  public AuditEventType getType() {
    return type;
  }

  public Long getActorUserId() {
    return actorUserId;
  }

  public Long getOrganizationId() {
    return organizationId;
  }

  public Long getUnitId() {
    return unitId;
  }

  public Long getTargetId() {
    return targetId;
  }

  public String getTargetType() {
    return targetType;
  }

  public String getDetails() {
    return details;
  }

  public OffsetDateTime getCreatedAt() {
    return createdAt;
  }
}
