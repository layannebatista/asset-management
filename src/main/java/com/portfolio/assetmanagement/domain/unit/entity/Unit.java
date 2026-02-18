package com.portfolio.assetmanagement.domain.unit.entity;

import com.portfolio.assetmanagement.domain.organization.entity.Organization;
import com.portfolio.assetmanagement.domain.unit.enums.UnitStatus;
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
import java.util.Objects;

/**
 * Entidade que representa uma unidade (filial).
 *
 * <p>Cada unidade pertence a exatamente uma organização (tenant).
 */
@Entity
@Table(name = "units")
public class Unit {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, length = 255)
  private String name;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "organization_id", nullable = false)
  private Organization organization;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  private UnitStatus status;

  @Column(name = "is_main", nullable = false)
  private boolean mainUnit;

  /** Construtor JPA. */
  protected Unit() {}

  /** Cria nova unidade ativa. */
  public Unit(String name, Organization organization, boolean mainUnit) {

    validateName(name);

    validateOrganization(organization);

    this.name = name.trim();

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

  /** Altera status com validação. */
  public void setStatus(UnitStatus status) {

    if (status == null) {

      throw new IllegalArgumentException("status não pode ser null");
    }

    this.status = status;
  }

  /** Indica se está ativa. */
  public boolean isActive() {

    return this.status == UnitStatus.ACTIVE;
  }

  /** Indica se está inativa. */
  public boolean isInactive() {

    return this.status == UnitStatus.INACTIVE;
  }

  /** Validação interna do nome. */
  private void validateName(String name) {

    if (name == null || name.isBlank()) {

      throw new IllegalArgumentException("Nome da unidade é obrigatório");
    }

    if (name.length() > 255) {

      throw new IllegalArgumentException("Nome da unidade não pode exceder 255 caracteres");
    }
  }

  /** Validação interna da organização. */
  private void validateOrganization(Organization organization) {

    if (organization == null || organization.getId() == null) {

      throw new IllegalArgumentException("organization é obrigatório");
    }
  }

  /** Igualdade baseada no id. */
  @Override
  public boolean equals(Object o) {

    if (this == o) return true;

    if (!(o instanceof Unit unit)) return false;

    return id != null && id.equals(unit.id);
  }

  @Override
  public int hashCode() {

    return Objects.hash(id);
  }
}
