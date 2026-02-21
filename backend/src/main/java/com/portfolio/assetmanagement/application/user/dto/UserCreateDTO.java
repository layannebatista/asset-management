package com.portfolio.assetmanagement.application.user.dto;

import com.portfolio.assetmanagement.security.enums.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

/**
 * DTO responsável por representar a requisição de criação de usuário.
 *
 * <p>Utilizado exclusivamente para criação interna de usuários por administradores do sistema.
 */
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

  @NotNull(message = "Unidade é obrigatória")
  private Long unitId;

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

  public Long getUnitId() {
    return unitId;
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

  public void setUnitId(Long unitId) {
    this.unitId = unitId;
  }
}
