package com.portfolio.asset_management.inventory.entity;

import com.portfolio.asset_management.inventory.enums.InventoryStatus;
import com.portfolio.asset_management.organization.entity.Organization;
import com.portfolio.asset_management.unit.entity.Unit;
import com.portfolio.asset_management.user.entity.User;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "inventory_sessions")
public class InventorySession {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(optional = false)
  @JoinColumn(name = "organization_id", nullable = false)
  private Organization organization;

  @ManyToOne(optional = false)
  @JoinColumn(name = "unit_id", nullable = false)
  private Unit unit;

  @ManyToOne(optional = false)
  @JoinColumn(name = "created_by", nullable = false)
  private User createdBy;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private InventoryStatus status;

  @Column(nullable = false)
  private LocalDateTime createdAt;

  private LocalDateTime closedAt;

  protected InventorySession() {}

  public InventorySession(Organization organization, Unit unit, User createdBy) {
    this.organization = organization;
    this.unit = unit;
    this.createdBy = createdBy;
    this.status = InventoryStatus.OPEN;
    this.createdAt = LocalDateTime.now();
  }

  public Long getId() {
    return id;
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

  public void start() {
    if (this.status != InventoryStatus.OPEN) {
      throw new IllegalStateException("Inventory session cannot be started");
    }
    this.status = InventoryStatus.IN_PROGRESS;
  }

  public void close() {
    if (this.status != InventoryStatus.IN_PROGRESS) {
      throw new IllegalStateException("Inventory session cannot be closed");
    }
    this.status = InventoryStatus.CLOSED;
    this.closedAt = LocalDateTime.now();
  }

  public void cancel() {
    if (this.status == InventoryStatus.CLOSED) {
      throw new IllegalStateException("Closed inventory session cannot be cancelled");
    }
    this.status = InventoryStatus.CANCELLED;
  }
}
