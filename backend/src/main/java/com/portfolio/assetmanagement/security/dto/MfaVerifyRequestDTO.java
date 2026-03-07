package com.portfolio.assetmanagement.security.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/** Payload do endpoint {@code POST /auth/mfa/verify}. */
public class MfaVerifyRequestDTO {

  @NotNull(message = "userId é obrigatório")
  private Long userId;

  @NotBlank(message = "Código MFA é obrigatório")
  private String code;

  public MfaVerifyRequestDTO() {}

  public Long getUserId() {
    return userId;
  }

  public String getCode() {
    return code;
  }

  public void setUserId(Long userId) {
    this.userId = userId;
  }

  public void setCode(String code) {
    this.code = code;
  }
}
