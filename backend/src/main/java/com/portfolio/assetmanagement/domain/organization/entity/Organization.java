package com.portfolio.assetmanagement.domain.organization.entity;

import com.portfolio.assetmanagement.domain.organization.enums.OrganizationStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.util.Objects;

/**
 * Entidade que representa uma organização (tenant).
 *
 * <p>É o nível mais alto de isolamento multi-tenant do sistema.
 */
@Entity
@Table(name = "organizations")
public class Organization {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, unique = true, length = 255)
  private String name;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  private OrganizationStatus status;

  /** Construtor JPA. */
  protected Organization() {}

  /** Cria nova organização sempre ativa. */
  public Organization(String name) {

    validateName(name);

    this.name = name.trim();

    this.status = OrganizationStatus.ACTIVE;
  }

  public Long getId() {
    return id;
  }

  public String getName() {
    return name;
  }

  public OrganizationStatus getStatus() {
    return status;
  }

  /** Altera status com validação. */
  public void setStatus(OrganizationStatus status) {

    if (status == null) {

      throw new IllegalArgumentException("status não pode ser null");
    }

    this.status = status;
  }

  /** Indica se está ativa. */
  public boolean isActive() {

    return this.status == OrganizationStatus.ACTIVE;
  }

  /** Indica se está inativa. */
  public boolean isInactive() {

    return this.status == OrganizationStatus.INACTIVE;
  }

  /** Validação interna do nome. */
  private void validateName(String name) {

    if (name == null || name.isBlank()) {

      throw new IllegalArgumentException("Nome da organização é obrigatório");
    }

    if (name.length() > 255) {

      throw new IllegalArgumentException("Nome da organização não pode exceder 255 caracteres");
    }
  }

  /** Igualdade baseada no id. */
  @Override
  public boolean equals(Object o) {

    if (this == o) return true;

    if (!(o instanceof Organization that)) return false;

    return id != null && id.equals(that.id);
  }

  @Override
  public int hashCode() {

    return Objects.hash(id);
  }
}
