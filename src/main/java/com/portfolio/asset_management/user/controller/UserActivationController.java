package com.portfolio.asset_management.user.controller;

import com.portfolio.asset_management.user.dto.UserActivationDTO;
import com.portfolio.asset_management.user.service.UserActivationService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/users")
public class UserActivationController {

  private final UserActivationService activationService;

  public UserActivationController(UserActivationService activationService) {

    this.activationService = activationService;
  }

  @PostMapping("/{id}/activate")
  public void activateUser(@PathVariable Long id, @RequestBody @Valid UserActivationDTO dto) {

    activationService.activateUser(
        id, dto.getPassword(), dto.getConfirmPassword(), dto.isLgpdAccepted());
  }
}
