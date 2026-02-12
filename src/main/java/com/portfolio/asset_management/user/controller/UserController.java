package com.portfolio.asset_management.user.controller;

import com.portfolio.asset_management.organization.entity.Organization;
import com.portfolio.asset_management.organization.service.OrganizationService;
import com.portfolio.asset_management.security.enums.UserRole;
import com.portfolio.asset_management.unit.entity.Unit;
import com.portfolio.asset_management.unit.service.UnitService;
import com.portfolio.asset_management.user.entity.User;
import com.portfolio.asset_management.user.service.UserService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/users")
public class UserController {

  private final UserService userService;

  private final OrganizationService organizationService;

  private final UnitService unitService;

  public UserController(
      UserService userService, OrganizationService organizationService, UnitService unitService) {

    this.userService = userService;
    this.organizationService = organizationService;
    this.unitService = unitService;
  }

  @PreAuthorize("hasRole('ADMIN')")
  @PostMapping
  public User createUser(
      @RequestParam String name,
      @RequestParam String email,
      @RequestParam String password,
      @RequestParam UserRole role,
      @RequestParam Long organizationId,
      @RequestParam Long unitId,
      @RequestParam String documentNumber) {

    Organization organization = organizationService.findById(organizationId);

    Unit unit = unitService.findById(unitId);

    return userService.createUser(name, email, password, role, organization, unit, documentNumber);
  }

  @PreAuthorize("hasRole('ADMIN')")
  @GetMapping("/{id}")
  public User findById(@PathVariable Long id) {

    return userService.findById(id);
  }

  @PreAuthorize("hasRole('ADMIN')")
  @PatchMapping("/{id}/block")
  public void blockUser(@PathVariable Long id) {

    userService.blockUser(id);
  }

  @PreAuthorize("hasRole('ADMIN')")
  @PatchMapping("/{id}/activate")
  public void activateUser(@PathVariable Long id) {

    userService.activateUser(id);
  }

  @PreAuthorize("hasRole('ADMIN')")
  @PatchMapping("/{id}/inactivate")
  public void inactivateUser(@PathVariable Long id) {

    userService.inactivateUser(id);
  }
}
