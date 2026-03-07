package com.portfolio.assetmanagement.application.user.dto;

import com.portfolio.assetmanagement.security.enums.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public class UserCreateDTO {

  @NotBlank(message = "Nome é obrigatório")
  private String name;

  @NotBlank(message = "Email é obrigatório")
  @Email(message = "Email inválido")
  private String email;

  @NotBlank(message = "Documento é obrigatório")
  @Pattern(regexp = "\\d{11}|\\d{14}", message = "Documento inválido (CPF ou CNPJ)")
  private String documentNumber;

  @NotNull(message = "Perfil é obrigatório")
  private UserRole role;

  @NotNull(message = "Organização é obrigatória")
  private Long organizationId;

  @NotNull(message = "Unidade é obrigatória")
  private Long unitId;

  /**
   * Número de telefone no formato E.164 sem '+' (ex: 5511999998888).
   *
   * <p>Opcional no cadastro. Quando presente, habilita MFA via WhatsApp e notificações de eventos.
   * Pode ser adicionado ou atualizado posteriormente.
   */
  @Pattern(
      regexp = "^\\d{10,15}$",
      message = "Telefone deve estar no formato E.164 sem '+' (ex: 5511999998888)")
  private String phoneNumber;

  public UserCreateDTO() {}

  public String getName() {
    return name;
  }

  public String getEmail() {
    return email;
  }

  public String getDocumentNumber() {
    return documentNumber;
  }

  public UserRole getRole() {
    return role;
  }

  public Long getOrganizationId() {
    return organizationId;
  }

  public Long getUnitId() {
    return unitId;
  }

  public String getPhoneNumber() {
    return phoneNumber;
  }

  public void setName(String name) {
    this.name = name;
  }

  public void setEmail(String email) {
    this.email = email;
  }

  public void setDocumentNumber(String documentNumber) {
    this.documentNumber = documentNumber;
  }

  public void setRole(UserRole role) {
    this.role = role;
  }

  public void setOrganizationId(Long organizationId) {
    this.organizationId = organizationId;
  }

  public void setUnitId(Long unitId) {
    this.unitId = unitId;
  }

  public void setPhoneNumber(String phoneNumber) {
    this.phoneNumber = phoneNumber;
  }
}
