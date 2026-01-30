package com.portfolio.asset_management.user.dto;

import com.portfolio.asset_management.security.enums.UserRole;
import com.portfolio.asset_management.user.enums.UserStatus;

/**
 * DTO responsável por representar a resposta da API para um usuário.
 *
 * <p>Define os dados públicos e seguros do usuário, evitando o vazamento de informações sensíveis.
 */
public class UserResponseDTO {

  private Long id;
  private String name;
  private String email;
  private UserRole role;
  private UserStatus status;
  private Long organizationId;
  private Long unitId;
  private boolean lgpdAccepted;

  public UserResponseDTO() {}

  public UserResponseDTO(
      Long id,
      String name,
      String email,
      UserRole role,
      UserStatus status,
      Long organizationId,
      Long unitId,
      boolean lgpdAccepted) {

    this.id = id;
    this.name = name;
    this.email = email;
    this.role = role;
    this.status = status;
    this.organizationId = organizationId;
    this.unitId = unitId;
    this.lgpdAccepted = lgpdAccepted;
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

  public Long getOrganizationId() {
    return organizationId;
  }

  public Long getUnitId() {
    return unitId;
  }

  public boolean isLgpdAccepted() {
    return lgpdAccepted;
  }
}
