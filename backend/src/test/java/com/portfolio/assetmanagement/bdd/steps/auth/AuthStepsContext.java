package com.portfolio.assetmanagement.bdd.steps.auth;

/**
 * Context compartilhado entre os diferentes Steps de Auth.
 * Mantém o estado (tokens, IDs) necessário ao longo do cenário.
 */
public class AuthStepsContext {

  private String refreshToken;
  private String previousRefreshToken;
  private String secondaryRefreshToken;
  private Long mfaUserId;
  private String mfaCode;

  // =========================================================
  // REFRESH TOKEN
  // =========================================================

  public String getRefreshToken() {
    return refreshToken;
  }

  public void setRefreshToken(String token) {
    this.refreshToken = token;
  }

  public String getPreviousRefreshToken() {
    return previousRefreshToken;
  }

  public void setPreviousRefreshToken(String token) {
    this.previousRefreshToken = token;
  }

  public String getSecondaryRefreshToken() {
    return secondaryRefreshToken;
  }

  public void setSecondaryRefreshToken(String token) {
    this.secondaryRefreshToken = token;
  }

  // =========================================================
  // MFA
  // =========================================================

  public Long getMfaUserId() {
    return mfaUserId;
  }

  public void setMfaUserId(Long userId) {
    this.mfaUserId = userId;
  }

  public String getMfaCode() {
    return mfaCode;
  }

  public void setMfaCode(String code) {
    this.mfaCode = code;
  }
}
