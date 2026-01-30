package com.portfolio.asset_management.user.entity;

import com.portfolio.asset_management.organization.entity.Organization;
import com.portfolio.asset_management.security.enums.UserRole;
import com.portfolio.asset_management.unit.entity.Unit;
import com.portfolio.asset_management.user.enums.UserStatus;
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
 * Entidade que representa um usuário (colaborador) do sistema.
 *
 * <p>O usuário sempre pertence a uma organização e a uma unidade, possui um perfil de acesso e um
 * status que controla seu ciclo de vida.
 */
@Entity
@Table(name = "users")
public class User {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false)
  private String name;

  @Column(nullable = false, unique = true)
  private String email;

  @Column(nullable = false)
  private String passwordHash;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private UserRole role;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private UserStatus status;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "organization_id", nullable = false)
  private Organization organization;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "unit_id", nullable = false)
  private Unit unit;

  @Column(name = "document_number", nullable = false)
  private String documentNumber;

  @Column(name = "lgpd_accepted", nullable = false)
  private boolean lgpdAccepted;

  protected User() {
    // Construtor protegido para uso do JPA
  }

  public User(
      String name,
      String email,
      String passwordHash,
      UserRole role,
      Organization organization,
      Unit unit,
      String documentNumber) {

    this.name = name;
    this.email = email;
    this.passwordHash = passwordHash;
    this.role = role;
    this.organization = organization;
    this.unit = unit;
    this.documentNumber = documentNumber;
    this.status = UserStatus.PENDING_ACTIVATION;
    this.lgpdAccepted = false;
  }

  public Long getId() {
    return id;
  }

  public String getName() {
    return name;
  }

  public String getEmail() {
    return email;
  }

  public UserRole getRole() {
    return role;
  }

  public UserStatus getStatus() {
    return status;
  }

  public Organization getOrganization() {
    return organization;
  }

  public Unit getUnit() {
    return unit;
  }

  public String getDocumentNumber() {
    return documentNumber;
  }

  public boolean isLgpdAccepted() {
    return lgpdAccepted;
  }

  public void setStatus(UserStatus status) {
    this.status = status;
  }

  public void acceptLgpd() {
    this.lgpdAccepted = true;
  }

  public void changePassword(String passwordHash) {
    this.passwordHash = passwordHash;
  }
}
