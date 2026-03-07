package com.portfolio.assetmanagement.domain.inventory.entity;

import com.portfolio.assetmanagement.domain.inventory.enums.InventoryStatus;
import com.portfolio.assetmanagement.domain.organization.entity.Organization;
import com.portfolio.assetmanagement.domain.unit.entity.Unit;
import com.portfolio.assetmanagement.domain.user.entity.User;
import com.portfolio.assetmanagement.shared.exception.BusinessException;
import jakarta.persistence.*;
import java.time.OffsetDateTime; // C2: era LocalDateTime

@Entity
@Table(
    name = "inventory_sessions",
    indexes = {
      @Index(name = "idx_inventory_session_org", columnList = "organization_id"),
      @Index(name = "idx_inventory_session_unit", columnList = "unit_id"),
      @Index(name = "idx_inventory_session_status", columnList = "status")
    })
public class InventorySession {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Version
  @Column(nullable = false)
  private Long version;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "organization_id", nullable = false, updatable = false)
  private Organization organization;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "unit_id", nullable = false, updatable = false)
  private Unit unit;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "created_by", nullable = false, updatable = false)
  private User createdBy;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private InventoryStatus status;

  @Column(nullable = false, updatable = false)
  private OffsetDateTime createdAt; // C2

  @Column private OffsetDateTime closedAt; // C2

  protected InventorySession() {}

  public InventorySession(Organization organization, Unit unit, User createdBy) {

    if (organization == null) throw new IllegalArgumentException("organization é obrigatório");
    if (unit == null) throw new IllegalArgumentException("unit é obrigatório");
    if (createdBy == null) throw new IllegalArgumentException("createdBy é obrigatório");

    if (!unit.getOrganization().getId().equals(organization.getId()))
      throw new BusinessException("Unit não pertence à organization");

    if (!createdBy.getOrganization().getId().equals(organization.getId()))
      throw new BusinessException("User não pertence à organization");

    this.organization = organization;
    this.unit = unit;
    this.createdBy = createdBy;
    this.status = InventoryStatus.OPEN;
    this.createdAt = OffsetDateTime.now(); // C2
  }

  public Long getId() {
    return id;
  }

  public Long getVersion() {
    return version;
  }

  public Organization getOrganization() {
    return organization;
  }

  public Unit getUnit() {
    return unit;
  }

  public User getCreatedBy() {
    return createdBy;
  }

  public InventoryStatus getStatus() {
    return status;
  }

  public OffsetDateTime getCreatedAt() {
    return createdAt;
  } // C2

  public OffsetDateTime getClosedAt() {
    return closedAt;
  } // C2

  public boolean isOpen() {
    return status == InventoryStatus.OPEN;
  }

  public boolean isInProgress() {
    return status == InventoryStatus.IN_PROGRESS;
  }

  public boolean isClosed() {
    return status == InventoryStatus.CLOSED;
  }

  public boolean isCancelled() {
    return status == InventoryStatus.CANCELLED;
  }

  public boolean isActive() {
    return status == InventoryStatus.OPEN || status == InventoryStatus.IN_PROGRESS;
  }

  public void start() {
    if (status != InventoryStatus.OPEN)
      throw new BusinessException("Somente sessões OPEN podem ser iniciadas");
    this.status = InventoryStatus.IN_PROGRESS;
  }

  public void close() {
    if (status != InventoryStatus.IN_PROGRESS)
      throw new BusinessException("Somente sessões IN_PROGRESS podem ser fechadas");
    this.status = InventoryStatus.CLOSED;
    this.closedAt = OffsetDateTime.now(); // C2
  }

  public void cancel() {
    if (status == InventoryStatus.CLOSED)
      throw new BusinessException("Sessão fechada não pode ser cancelada");
    if (status == InventoryStatus.CANCELLED)
      throw new BusinessException("Sessão já está cancelada");
    this.status = InventoryStatus.CANCELLED;
  }

  public void validateOwnership(Long organizationId) {
    if (!organization.getId().equals(organizationId))
      throw new BusinessException("Sessão não pertence à organization");
  }
}
