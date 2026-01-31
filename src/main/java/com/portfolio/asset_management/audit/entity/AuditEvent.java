package com.portfolio.asset_management.audit.entity;

import com.portfolio.asset_management.audit.enums.AuditEventType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;

/**
 * Entidade que representa um evento de auditoria do sistema.
 *
 * <p>Registra ações relevantes de negócio para fins de rastreabilidade, conformidade e análise
 * histórica.
 */
@Entity
@Table(name = "audit_events")
public class AuditEvent {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private AuditEventType type;

  /**
   * Identificador do usuário que executou a ação. Pode ser null para ações automáticas do sistema.
   */
  @Column(name = "actor_user_id")
  private Long actorUserId;

  /** Organização relacionada ao evento. */
  @Column(name = "organization_id", nullable = false)
  private Long organizationId;

  /** Unidade relacionada ao evento (quando aplicável). */
  @Column(name = "unit_id")
  private Long unitId;

  /** Recurso principal afetado pelo evento (ex: assetId, userId). */
  @Column(name = "target_id")
  private Long targetId;

  /** Informações adicionais do evento em formato texto/JSON simples. */
  @Column(columnDefinition = "TEXT")
  private String details;

  @Column(name = "created_at", nullable = false)
  private OffsetDateTime createdAt;

  protected AuditEvent() {
    // Construtor protegido para uso do JPA
  }

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
    this.details = details;
    this.createdAt = OffsetDateTime.now();
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
