package com.portfolio.asset_management.user.dto;

import jakarta.validation.constraints.NotBlank;

public class UserUpdateDTO {

  @NotBlank private String name;

  public String getName() {
    return name;
  }
}
