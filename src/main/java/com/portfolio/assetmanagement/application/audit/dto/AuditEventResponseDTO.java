package com.portfolio.assetmanagement.application.audit.dto;

import com.portfolio.assetmanagement.domain.audit.entity.AuditEvent;
import com.portfolio.assetmanagement.domain.audit.enums.AuditEventType;
import java.time.OffsetDateTime;

public class AuditEventResponseDTO {

  private Long id;

  private AuditEventType eventType;

  private String targetType;

  private Long targetId;

  private Long actorUserId;

  private Long organizationId;

  private Long unitId;

  private String details;

  private OffsetDateTime createdAt;

  public AuditEventResponseDTO(AuditEvent entity) {

    this.id = entity.getId();
    this.eventType = entity.getType();
    this.targetType = entity.getTargetType();
    this.targetId = entity.getTargetId();
    this.actorUserId = entity.getActorUserId();
    this.organizationId = entity.getOrganizationId();
    this.unitId = entity.getUnitId();
    this.details = entity.getDetails();
    this.createdAt = entity.getCreatedAt();
  }

  public Long getId() {
    return id;
  }

  public AuditEventType getEventType() {
    return eventType;
  }

  public String getTargetType() {
    return targetType;
  }

  public Long getTargetId() {
    return targetId;
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

  public String getDetails() {
    return details;
  }

  public OffsetDateTime getCreatedAt() {
    return createdAt;
  }
}