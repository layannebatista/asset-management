package com.portfolio.asset_management.inventory.entity;

import com.portfolio.asset_management.inventory.enums.InventoryStatus;
import com.portfolio.asset_management.organization.entity.Organization;
import com.portfolio.asset_management.shared.exception.BusinessException;
import com.portfolio.asset_management.unit.entity.Unit;
import com.portfolio.asset_management.user.entity.User;
import jakarta.persistence.*;
import java.time.LocalDateTime;

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

  /**
   * Controle de concorrência otimista.
   *
   * <p>Evita:
   *
   * <p>- dois usuários iniciarem ao mesmo tempo - dois usuários fecharem ao mesmo tempo -
   * cancelamento concorrente
   */
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
  private LocalDateTime createdAt;

  @Column private LocalDateTime closedAt;

  protected InventorySession() {}

  public InventorySession(Organization organization, Unit unit, User createdBy) {

    if (organization == null) {
      throw new IllegalArgumentException("organization é obrigatório");
    }

    if (unit == null) {
      throw new IllegalArgumentException("unit é obrigatório");
    }

    if (createdBy == null) {
      throw new IllegalArgumentException("createdBy é obrigatório");
    }

    if (!unit.getOrganization().getId().equals(organization.getId())) {

      throw new BusinessException("Unit não pertence à organization");
    }

    if (!createdBy.getOrganization().getId().equals(organization.getId())) {

      throw new BusinessException("User não pertence à organization");
    }

    this.organization = organization;
    this.unit = unit;
    this.createdBy = createdBy;
    this.status = InventoryStatus.OPEN;
    this.createdAt = LocalDateTime.now();
  }

  public Long getId() {
    return id;
  }

  /** Usado automaticamente pelo Hibernate para controle de concorrência. */
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

  public LocalDateTime getCreatedAt() {
    return createdAt;
  }

  public LocalDateTime getClosedAt() {
    return closedAt;
  }

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

  /** Inicia sessão. */
  public void start() {

    if (status != InventoryStatus.OPEN) {

      throw new BusinessException("Somente sessões OPEN podem ser iniciadas");
    }

    this.status = InventoryStatus.IN_PROGRESS;
  }

  /** Fecha sessão. */
  public void close() {

    if (status != InventoryStatus.IN_PROGRESS) {

      throw new BusinessException("Somente sessões IN_PROGRESS podem ser fechadas");
    }

    this.status = InventoryStatus.CLOSED;
    this.closedAt = LocalDateTime.now();
  }

  /** Cancela sessão. */
  public void cancel() {

    if (status == InventoryStatus.CLOSED) {

      throw new BusinessException("Sessão fechada não pode ser cancelada");
    }

    if (status == InventoryStatus.CANCELLED) {

      throw new BusinessException("Sessão já está cancelada");
    }

    this.status = InventoryStatus.CANCELLED;
  }

  /** Valida se pertence à organization. */
  public void validateOwnership(Long organizationId) {

    if (!organization.getId().equals(organizationId)) {

      throw new BusinessException("Sessão não pertence à organization");
    }
  }
}
