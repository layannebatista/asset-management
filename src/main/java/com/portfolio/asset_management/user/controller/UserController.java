package com.portfolio.asset_management.user.controller;

import com.portfolio.asset_management.organization.entity.Organization;
import com.portfolio.asset_management.organization.service.OrganizationService;
import com.portfolio.asset_management.unit.entity.Unit;
import com.portfolio.asset_management.unit.service.UnitService;
import com.portfolio.asset_management.user.dto.UserCreateDTO;
import com.portfolio.asset_management.user.dto.UserResponseDTO;
import com.portfolio.asset_management.user.entity.User;
import com.portfolio.asset_management.user.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Controller responsável pelos endpoints de gerenciamento de usuários.
 *
 * <p>Permite criação interna de usuários, consulta e controle do ciclo de vida do usuário no
 * sistema.
 */
@RestController
@RequestMapping("/organizations/{organizationId}/users")
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

  @PostMapping
  public ResponseEntity<UserResponseDTO> createUser(
      @PathVariable Long organizationId, @Valid @RequestBody UserCreateDTO request) {

    Organization organization = organizationService.findById(organizationId);
    Unit unit = unitService.findById(request.getUnitId());

    // Senha inicial será gerada e enviada por email/WhatsApp (fluxo futuro)
    String temporaryPasswordHash = "temporary-hash";

    User user =
        userService.createUser(
            request.getName(),
            request.getEmail(),
            temporaryPasswordHash,
            request.getRole(),
            organization,
            unit,
            request.getDocumentNumber());

    UserResponseDTO response =
        new UserResponseDTO(
            user.getId(),
            user.getName(),
            user.getEmail(),
            user.getRole(),
            user.getStatus(),
            user.getOrganization().getId(),
            user.getUnit().getId(),
            user.isLgpdAccepted());

    return ResponseEntity.status(HttpStatus.CREATED).body(response);
  }

  @GetMapping("/{userId}")
  public ResponseEntity<UserResponseDTO> getUser(@PathVariable Long userId) {

    User user = userService.findById(userId);

    UserResponseDTO response =
        new UserResponseDTO(
            user.getId(),
            user.getName(),
            user.getEmail(),
            user.getRole(),
            user.getStatus(),
            user.getOrganization().getId(),
            user.getUnit().getId(),
            user.isLgpdAccepted());

    return ResponseEntity.ok(response);
  }

  @PatchMapping("/{userId}/activate")
  public ResponseEntity<Void> activateUser(@PathVariable Long userId) {
    userService.activateUser(userId);
    return ResponseEntity.noContent().build();
  }

  @PatchMapping("/{userId}/block")
  public ResponseEntity<Void> blockUser(@PathVariable Long userId) {
    userService.blockUser(userId);
    return ResponseEntity.noContent().build();
  }

  @PatchMapping("/{userId}/inactivate")
  public ResponseEntity<Void> inactivateUser(@PathVariable Long userId) {
    userService.inactivateUser(userId);
    return ResponseEntity.noContent().build();
  }

  @PatchMapping("/{userId}/accept-lgpd")
  public ResponseEntity<Void> acceptLgpd(@PathVariable Long userId) {
    userService.acceptLgpd(userId);
    return ResponseEntity.noContent().build();
  }
}
