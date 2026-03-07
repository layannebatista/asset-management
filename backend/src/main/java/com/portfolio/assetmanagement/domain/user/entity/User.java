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

  @Version
  @Column(nullable = false)
  private Long version;

  @Column(nullable = false, length = 255)
  private String name;

  @Column(nullable = false, unique = true, length = 255)
  private String email;

  // Nullable — senha definida na ativação via UserActivationService
  @Column(name = "password_hash", nullable = true, length = 255)
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

  /**
   * Número de telefone no formato E.164 sem '+' (ex: 5511999998888).
   *
   * <p>Nullable — quando preenchido, habilita MFA via WhatsApp no login e notificações de eventos
   * do sistema.
   */
  @Column(name = "phone_number", nullable = true, length = 20)
  private String phoneNumber;

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
    this.documentNumber = documentNumber;
    this.status = UserStatus.PENDING_ACTIVATION;
    this.lgpdAccepted = false;
  }

  // ─────────────────────────────────────────────
  //  Business methods
  // ─────────────────────────────────────────────

  public void changePassword(String encodedPassword) {
    if (encodedPassword == null || encodedPassword.isBlank()) {
      throw new IllegalArgumentException("Senha codificada não pode ser nula ou vazia");
    }
    this.passwordHash = encodedPassword;
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

  public void updatePhoneNumber(String phoneNumber) {
    this.phoneNumber = phoneNumber;
  }

  // ─────────────────────────────────────────────
  //  Validations
  // ─────────────────────────────────────────────

  private void validateName(String name) {
    if (name == null || name.trim().isEmpty()) {
      throw new IllegalArgumentException("Nome é obrigatório");
    }
  }

  private void validateEmail(String email) {
    if (email == null || email.trim().isEmpty()) {
      throw new IllegalArgumentException("Email é obrigatório");
    }
  }

  private void validateRole(UserRole role) {
    if (role == null) {
      throw new IllegalArgumentException("Perfil é obrigatório");
    }
  }

  private void validateOrganization(Organization organization) {
    if (organization == null) {
      throw new IllegalArgumentException("Organização é obrigatória");
    }
  }

  private void validateUnit(Unit unit, Organization organization) {
    if (unit == null) {
      throw new IllegalArgumentException("Unidade é obrigatória");
    }
    if (!unit.getOrganization().getId().equals(organization.getId())) {
      throw new IllegalArgumentException("Unidade não pertence à organização informada");
    }
  }

  private void validateDocument(String documentNumber) {
    if (documentNumber == null || documentNumber.trim().isEmpty()) {
      throw new IllegalArgumentException("Documento é obrigatório");
    }
  }

  // ─────────────────────────────────────────────
  //  Getters
  // ─────────────────────────────────────────────

  public Long getId() {
    return id;
  }

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

  public String getPhoneNumber() {
    return phoneNumber;
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) return true;
    if (!(o instanceof User that)) return false;
    return id != null && id.equals(that.id);
  }

  @Override
  public int hashCode() {
    return Objects.hash(id);
  }
}
