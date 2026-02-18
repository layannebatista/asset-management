package com.portfolio.assetmanagement.security.dto;

import com.portfolio.assetmanagement.security.enums.UserRole;

/**
 * DTO responsável por representar a resposta de um login bem-sucedido.
 *
 * <p>Expõe apenas as informações necessárias para identificação do usuário autenticado e controle
 * de acesso no cliente.
 */
public class LoginResponseDTO {

  private String accessToken;
  private String tokenType;
  private UserRole role;

  public LoginResponseDTO() {}

  public LoginResponseDTO(String accessToken, String tokenType, UserRole role) {
    this.accessToken = accessToken;
    this.tokenType = tokenType;
    this.role = role;
  }

  public String getAccessToken() {
    return accessToken;
  }

  public void setAccessToken(String accessToken) {
    this.accessToken = accessToken;
  }

  public String getTokenType() {
    return tokenType;
  }

  public void setTokenType(String tokenType) {
    this.tokenType = tokenType;
  }

  public UserRole getRole() {
    return role;
  }

  public void setRole(UserRole role) {
    this.role = role;
  }
}