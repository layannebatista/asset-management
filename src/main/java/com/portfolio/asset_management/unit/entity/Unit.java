package com.portfolio.asset_management.unit.entity;

import com.portfolio.asset_management.organization.entity.Organization;
import com.portfolio.asset_management.unit.enums.UnitStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/**
 * Entidade que representa uma unidade (filial) de uma organização.
 *
 * <p>Cada unidade pertence a uma única organização e pode ser marcada como unidade principal.
 */
@Entity
@Table(name = "units")
public class Unit {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false)
  private String name;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "organization_id", nullable = false)
  private Organization organization;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private UnitStatus status;

  @Column(name = "is_main", nullable = false)
  private boolean mainUnit;

  protected Unit() {
    // Construtor protegido para uso do JPA
  }

  public Unit(String name, Organization organization, boolean mainUnit) {
    this.name = name;
    this.organization = organization;
    this.mainUnit = mainUnit;
    this.status = UnitStatus.ACTIVE;
  }

  public Long getId() {
    return id;
  }

  public String getName() {
    return name;
  }

  public Organization getOrganization() {
    return organization;
  }

  public UnitStatus getStatus() {
    return status;
  }

  public boolean isMainUnit() {
    return mainUnit;
  }

  public void setStatus(UnitStatus status) {
    this.status = status;
  }
}
