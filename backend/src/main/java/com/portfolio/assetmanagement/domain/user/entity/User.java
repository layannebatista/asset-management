package com.portfolio.assetmanagement.domain.user.entity;

import com.portfolio.assetmanagement.domain.organization.entity.Organization;
import com.portfolio.assetmanagement.domain.unit.entity.Unit;
import com.portfolio.assetmanagement.domain.user.enums.UserStatus;
import com.portfolio.assetmanagement.security.enums.UserRole;
import jakarta.persistence.*;
import java.util.Objects;

@Entity
@Table(name = "users")
public class User {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  /**
   * Controle de concorrência otimista.
   *
   * <p>Protege contra alterações simultâneas concorrentes.
   */
  @Version
  @Column(nullable = false)
  private Long version;

  @Column(nullable = false, length = 255)
  private String name;

  @Column(nullable = false, unique = true, length = 255)
  private String email;

  @Column(name = "password_hash", nullable = false, length = 255)
  private String passwordHash;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 50)
  private UserRole role;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 50)
  private UserStatus status;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "organization_id", nullable = false)
  private Organization organization;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "unit_id", nullable = false)
  private Unit unit;

  @Column(name = "document_number", nullable = false, length = 50)
  private String documentNumber;

  @Column(name = "lgpd_accepted", nullable = false)
  private boolean lgpdAccepted;

  protected User() {}

  public User(
      String name,
      String email,
      String passwordHash,
      UserRole role,
      Organization organization,
      Unit unit,
      String documentNumber) {

    validateName(name);
    validateEmail(email);
    validatePassword(passwordHash);
    validateRole(role);
    validateOrganization(organization);
    validateUnit(unit, organization);
    validateDocument(documentNumber);

    this.name = name.trim();
    this.email = email.trim().toLowerCase();
    this.passwordHash = passwordHash;
    this.role = role;
    this.organization = organization;
    this.unit = unit;
    this.documentNumber = documentNumber.trim();

    this.status = UserStatus.PENDING_ACTIVATION;
    this.lgpdAccepted = false;
  }

  public Long getId() {
    return id;
  }

  /** Usado automaticamente pelo Hibernate para optimistic locking. */
  public Long getVersion() {
    return version;
  }

  public String getName() {
    return name;
  }

  public String getEmail() {
    return email;
  }

  public String getPasswordHash() {
    return passwordHash;
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

  public boolean isActive() {
    return status == UserStatus.ACTIVE;
  }

  public boolean isBlocked() {
    return status == UserStatus.BLOCKED;
  }

  public boolean isInactive() {
    return status == UserStatus.INACTIVE;
  }

  public boolean isPendingActivation() {
    return status == UserStatus.PENDING_ACTIVATION;
  }

  public void activate() {
    this.status = UserStatus.ACTIVE;
  }

  public void block() {
    this.status = UserStatus.BLOCKED;
  }

  public void inactivate() {
    this.status = UserStatus.INACTIVE;
  }

  public void acceptLgpd() {
    this.lgpdAccepted = true;
  }

  public void changePassword(String passwordHash) {

    validatePassword(passwordHash);

    this.passwordHash = passwordHash;
  }

  private void validateName(String name) {

    if (name == null || name.isBlank()) {
      throw new IllegalArgumentException("Nome é obrigatório");
    }
  }

  private void validateEmail(String email) {

    if (email == null || email.isBlank()) {
      throw new IllegalArgumentException("Email é obrigatório");
    }

    if (email.length() > 255) {
      throw new IllegalArgumentException("Email inválido");
    }
  }

  private void validatePassword(String passwordHash) {

    if (passwordHash == null || passwordHash.isBlank()) {
      throw new IllegalArgumentException("Password hash é obrigatório");
    }
  }

  private void validateRole(UserRole role) {

    if (role == null) {
      throw new IllegalArgumentException("Role é obrigatório");
    }
  }

  private void validateOrganization(Organization organization) {

    if (organization == null || organization.getId() == null) {
      throw new IllegalArgumentException("Organization é obrigatória");
    }
  }

  private void validateUnit(Unit unit, Organization organization) {

    if (unit == null || unit.getId() == null) {
      throw new IllegalArgumentException("Unit é obrigatória");
    }

    if (!unit.getOrganization().getId().equals(organization.getId())) {
      throw new IllegalArgumentException("Unit não pertence à Organization");
    }
  }

  private void validateDocument(String document) {

    if (document == null || document.isBlank()) {
      throw new IllegalArgumentException("Documento é obrigatório");
    }
  }

  @Override
  public boolean equals(Object o) {

    if (this == o) return true;

    if (!(o instanceof User user)) return false;

    return id != null && id.equals(user.id);
  }

  @Override
  public int hashCode() {
    return Objects.hash(id);
  }
}
