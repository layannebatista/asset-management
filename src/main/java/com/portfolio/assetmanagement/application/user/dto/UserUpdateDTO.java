package com.portfolio.assetmanagement.application.user.dto;

import jakarta.validation.constraints.NotBlank;

public class UserUpdateDTO {

  @NotBlank private String name;

  public String getName() {
    return name;
  }
}
