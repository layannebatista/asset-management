package com.portfolio.asset_management.audit.dto;

import com.portfolio.asset_management.audit.enums.AuditEventType;
import java.time.OffsetDateTime;

/**
 * DTO de resposta para eventos de auditoria.
 *
 * <p>Representa a visão externa de um evento auditável, utilizada em consultas e relatórios.
 */
public class AuditEventResponseDTO {

  private final Long id;
  private final AuditEventType type;
  private final Long actorUserId;
  private final Long organizationId;
  private final Long unitId;
  private final Long targetId;
  private final String details;
  private final OffsetDateTime createdAt;

  public AuditEventResponseDTO(
      Long id,
      AuditEventType type,
      Long actorUserId,
      Long organizationId,
      Long unitId,
      Long targetId,
      String details,
      OffsetDateTime createdAt) {

    this.id = id;
    this.type = type;
    this.actorUserId = actorUserId;
    this.organizationId = organizationId;
    this.unitId = unitId;
    this.targetId = targetId;
    this.details = details;
    this.createdAt = createdAt;
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

  public String getDetails() {
    return details;
  }

  public OffsetDateTime getCreatedAt() {
    return createdAt;
  }
}
