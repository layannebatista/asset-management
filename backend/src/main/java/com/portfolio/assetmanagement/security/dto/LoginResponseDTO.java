package com.portfolio.assetmanagement.security.dto;

import com.portfolio.assetmanagement.security.enums.UserRole;

/**
 * DTO de resposta do login — inclui access token, refresh token e suporte a MFA.
 *
 * <p>Cenários:
 *
 * <ul>
 *   <li><b>Login direto</b>: {@code accessToken} + {@code refreshToken} preenchidos
 *   <li><b>MFA challenge</b>: {@code mfaRequired=true} + {@code userId}, tokens nulos
 *   <li><b>Refresh</b>: {@code accessToken} + {@code refreshToken} preenchidos, {@code role} nulo
 * </ul>
 */
public class LoginResponseDTO {

  private String accessToken;
  private String refreshToken;
  private String tokenType;
  private UserRole role;
  private boolean mfaRequired;
  private Long userId;

  // 🔥 NOVOS CAMPOS (mantidos opcionais para compatibilidade)
  private String email;
  private Long organizationId;
  private Long unitId;

  public LoginResponseDTO() {}

  /** Login completo sem MFA. */
  public LoginResponseDTO(
      String accessToken, String refreshToken, String tokenType, UserRole role) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.tokenType = tokenType;
    this.role = role;
    this.mfaRequired = false;
  }

  // 🔥 NOVO CONSTRUTOR COMPLETO (usado pelo AuthService atualizado)
  public LoginResponseDTO(
      String accessToken,
      String refreshToken,
      String tokenType,
      UserRole role,
      boolean mfaRequired,
      Long userId,
      String email,
      Long organizationId,
      Long unitId) {

    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.tokenType = tokenType;
    this.role = role;
    this.mfaRequired = mfaRequired;
    this.userId = userId;
    this.email = email;
    this.organizationId = organizationId;
    this.unitId = unitId;
  }

  /** Challenge MFA — tokens não emitidos ainda. */
  public static LoginResponseDTO mfaChallenge(Long userId) {
    LoginResponseDTO dto = new LoginResponseDTO();
    dto.mfaRequired = true;
    dto.userId = userId;
    return dto;
  }

  /** Resposta de refresh — role não é retornada (cliente já sabe). */
  public static LoginResponseDTO refreshed(String accessToken, String refreshToken) {
    LoginResponseDTO dto = new LoginResponseDTO();
    dto.accessToken = accessToken;
    dto.refreshToken = refreshToken;
    dto.tokenType = "Bearer";
    dto.mfaRequired = false;
    return dto;
  }

  public String getAccessToken() {
    return accessToken;
  }

  public String getRefreshToken() {
    return refreshToken;
  }

  public String getTokenType() {
    return tokenType;
  }

  public UserRole getRole() {
    return role;
  }

  public boolean isMfaRequired() {
    return mfaRequired;
  }

  public Long getUserId() {
    return userId;
  }

  // 🔥 NOVOS GETTERS
  public String getEmail() {
    return email;
  }

  public Long getOrganizationId() {
    return organizationId;
  }

  public Long getUnitId() {
    return unitId;
  }

  public void setAccessToken(String v) {
    this.accessToken = v;
  }

  public void setRefreshToken(String v) {
    this.refreshToken = v;
  }

  public void setTokenType(String v) {
    this.tokenType = v;
  }

  public void setRole(UserRole v) {
    this.role = v;
  }

  public void setMfaRequired(boolean v) {
    this.mfaRequired = v;
  }

  public void setUserId(Long v) {
    this.userId = v;
  }

  // 🔥 NOVOS SETTERS
  public void setEmail(String v) {
    this.email = v;
  }

  public void setOrganizationId(Long v) {
    this.organizationId = v;
  }

  public void setUnitId(Long v) {
    this.unitId = v;
  }
}