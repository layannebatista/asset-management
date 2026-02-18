package com.portfolio.assetmanagement.interfaces.rest.user.controller;

import com.portfolio.assetmanagement.application.user.service.UserActivationService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/users/activation")
public class UserActivationController {

  private final UserActivationService activationService;

  public UserActivationController(UserActivationService activationService) {

    this.activationService = activationService;
  }

  /** Gera token de ativação para usuário. */
  @PostMapping("/token/{userId}")
  public String generateToken(@PathVariable Long userId) {

    return activationService.generateActivationToken(userId);
  }

  /** Ativa usuário usando token. */
  @PostMapping("/activate")
  public void activateUser(
      @RequestParam String token,
      @RequestParam String password,
      @RequestParam String confirmPassword,
      @RequestParam boolean lgpdAccepted) {

    activationService.activateUser(token, password, confirmPassword, lgpdAccepted);
  }
}