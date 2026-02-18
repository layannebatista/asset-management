package com.portfolio.assetmanagement.domain.audit.entity;

import com.portfolio.assetmanagement.domain.audit.enums.AuditEventType;
import jakarta.persistence.*;
import java.time.OffsetDateTime;

/**
 * Entidade de auditoria.
 *
 * <p>Representa qualquer evento relevante ocorrido no sistema.
 *
 * <p>Garantias enterprise:
 *
 * <p>- imutabilidade lógica - consistência temporal - integridade multi-tenant - compatível com
 * compliance (LGPD, SOC2, ISO 27001)
 */
@Entity
@Table(
    name = "audit_events",
    indexes = {
      @Index(name = "idx_audit_org", columnList = "organization_id"),
      @Index(name = "idx_audit_actor", columnList = "actor_user_id"),
      @Index(name = "idx_audit_target", columnList = "target_id"),
      @Index(name = "idx_audit_created_at", columnList = "created_at"),
      @Index(name = "idx_audit_type", columnList = "type")
    })
public class AuditEvent {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, updatable = false)
  private AuditEventType type;

  @Column(name = "actor_user_id", updatable = false)
  private Long actorUserId;

  @Column(name = "organization_id", nullable = false, updatable = false)
  private Long organizationId;

  @Column(name = "unit_id", updatable = false)
  private Long unitId;

  @Column(name = "target_id", updatable = false)
  private Long targetId;

  @Column(name = "target_type", length = 100, updatable = false)
  private String targetType;

  @Column(columnDefinition = "TEXT", updatable = false)
  private String details;

  @Column(name = "created_at", nullable = false, updatable = false)
  private OffsetDateTime createdAt;

  protected AuditEvent() {}

  /** Construtor enterprise completo. */
  public AuditEvent(
      AuditEventType type,
      Long actorUserId,
      Long organizationId,
      Long unitId,
      Long targetId,
      String targetType,
      String details) {

    validate(type, organizationId);

    this.type = type;
    this.actorUserId = actorUserId;
    this.organizationId = organizationId;
    this.unitId = unitId;
    this.targetId = targetId;
    this.targetType = normalize(targetType);
    this.details = normalize(details);
    this.createdAt = OffsetDateTime.now();
  }

  /** Construtor legado compatível com services existentes. */
  public AuditEvent(
      AuditEventType type,
      Long actorUserId,
      Long organizationId,
      Long unitId,
      Long targetId,
      String details) {

    validate(type, organizationId);

    this.type = type;
    this.actorUserId = actorUserId;
    this.organizationId = organizationId;
    this.unitId = unitId;
    this.targetId = targetId;
    this.targetType = null;
    this.details = normalize(details);
    this.createdAt = OffsetDateTime.now();
  }

  /** Garantia adicional caso criado via JPA. */
  @PrePersist
  protected void onCreate() {

    if (this.createdAt == null) {
      this.createdAt = OffsetDateTime.now();
    }

    validate(type, organizationId);
  }

  /** Validação de integridade. */
  private void validate(AuditEventType type, Long organizationId) {

    if (type == null) {

      throw new IllegalArgumentException("AuditEvent type é obrigatório");
    }

    if (organizationId == null) {

      throw new IllegalArgumentException("organizationId é obrigatório");
    }
  }

  /** Normaliza texto. */
  private String normalize(String value) {

    if (value == null) {
      return null;
    }

    String trimmed = value.trim();

    if (trimmed.isEmpty()) {
      return null;
    }

    if (trimmed.length() > 5000) {

      return trimmed.substring(0, 5000);
    }

    return trimmed;
  }

  // GETTERS

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