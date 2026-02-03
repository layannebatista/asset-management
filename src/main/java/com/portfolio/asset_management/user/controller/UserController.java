package com.portfolio.asset_management.user.controller;

import com.portfolio.asset_management.organization.entity.Organization;
import com.portfolio.asset_management.security.enums.UserRole;
import com.portfolio.asset_management.unit.entity.Unit;
import com.portfolio.asset_management.user.entity.User;
import com.portfolio.asset_management.user.service.UserService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Controller responsável pelos endpoints de gerenciamento de usuários.
 *
 * <p>Apenas administradores podem criar e gerenciar usuários.
 */
@RestController
@RequestMapping("/users")
public class UserController {

  private final UserService userService;

  public UserController(UserService userService) {
    this.userService = userService;
  }

  /** Criação interna de usuário (somente ADMIN). */
  @PreAuthorize("hasRole('ADMIN')")
  @PostMapping
  public User createUser(
      @RequestParam String name,
      @RequestParam String email,
      @RequestParam String passwordHash,
      @RequestParam UserRole role,
      @RequestParam Organization organization,
      @RequestParam Unit unit,
      @RequestParam String documentNumber) {

    return userService.createUser(
        name, email, passwordHash, role, organization, unit, documentNumber);
  }

  /** Consulta usuário por id (somente ADMIN). */
  @PreAuthorize("hasRole('ADMIN')")
  @GetMapping("/{id}")
  public User findById(@PathVariable Long id) {
    return userService.findById(id);
  }

  /** Bloqueia usuário (somente ADMIN). */
  @PreAuthorize("hasRole('ADMIN')")
  @PatchMapping("/{id}/block")
  public void blockUser(@PathVariable Long id) {
    userService.blockUser(id);
  }

  /** Ativa usuário (somente ADMIN). */
  @PreAuthorize("hasRole('ADMIN')")
  @PatchMapping("/{id}/activate")
  public void activateUser(@PathVariable Long id) {
    userService.activateUser(id);
  }
}
