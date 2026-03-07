package com.portfolio.assetmanagement.security.dto;

import jakarta.validation.constraints.NotBlank;

/** Payload para renovação de access token via refresh token. */
public class RefreshRequestDTO {

  @NotBlank(message = "refreshToken é obrigatório")
  private String refreshToken;

  public RefreshRequestDTO() {}

  public String getRefreshToken() {
    return refreshToken;
  }

  public void setRefreshToken(String refreshToken) {
    this.refreshToken = refreshToken;
  }
}
