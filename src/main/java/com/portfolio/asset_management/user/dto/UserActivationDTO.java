package com.portfolio.asset_management.user.dto;

import jakarta.validation.constraints.NotBlank;

public class UserActivationDTO {

  @NotBlank private String password;

  @NotBlank private String confirmPassword;

  private boolean lgpdAccepted;

  public String getPassword() {
    return password;
  }

  public String getConfirmPassword() {
    return confirmPassword;
  }

  public boolean isLgpdAccepted() {
    return lgpdAccepted;
  }
}
