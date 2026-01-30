package com.portfolio.asset_management.organization.entity;

import com.portfolio.asset_management.organization.enums.OrganizationStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Entidade que representa uma organização (empresa) no sistema.
 *
 * <p>A organização é o nível mais alto de isolamento de dados (tenant) e impacta o acesso e a
 * operação de todos os módulos.
 */
@Entity
@Table(name = "organizations")
public class Organization {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, unique = true)
  private String name;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private OrganizationStatus status;

  protected Organization() {
    // Construtor protegido para uso do JPA
  }

  public Organization(String name) {
    this.name = name;
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

  public void setStatus(OrganizationStatus status) {
    this.status = status;
  }
}
