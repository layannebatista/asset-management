package com.portfolio.assetmanagement.interfaces.rest.user.controller;

import com.portfolio.assetmanagement.application.organization.service.OrganizationService;
import com.portfolio.assetmanagement.application.unit.service.UnitService;
import com.portfolio.assetmanagement.application.user.dto.UserCreateDTO;
import com.portfolio.assetmanagement.application.user.dto.UserResponseDTO;
import com.portfolio.assetmanagement.application.user.mapper.UserMapper;
import com.portfolio.assetmanagement.application.user.service.UserQueryService;
import com.portfolio.assetmanagement.application.user.service.UserService;
import com.portfolio.assetmanagement.domain.organization.entity.Organization;
import com.portfolio.assetmanagement.domain.unit.entity.Unit;
import com.portfolio.assetmanagement.domain.user.entity.User;
import com.portfolio.assetmanagement.domain.user.enums.UserStatus;
import com.portfolio.assetmanagement.shared.pagination.PageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.stream.Collectors;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Users", description = "Gerenciamento de usuários e controle de acesso")
@RestController
@RequestMapping("/users")
public class UserController {

  private final UserService userService;
  private final UserQueryService userQueryService;
  private final OrganizationService organizationService;
  private final UnitService unitService;
  private final UserMapper userMapper;

  public UserController(
      UserService userService,
      UserQueryService userQueryService,
      OrganizationService organizationService,
      UnitService unitService,
      UserMapper userMapper) {
    this.userService = userService;
    this.userQueryService = userQueryService;
    this.organizationService = organizationService;
    this.unitService = unitService;
    this.userMapper = userMapper;
  }

  @Operation(
      summary = "Listar usuários",
      description =
          """
      Lista usuários da organização com filtros opcionais e paginação.
      Filtros: status, unitId, includeInactive.
      Ordenação padrão: name ASC.
      """)
  @GetMapping
  // 🔥 CORREÇÃO: permitir todos os papéis (filtro é feito no service)
  @PreAuthorize("hasAnyRole('ADMIN','GESTOR','OPERADOR')")
  public PageResponse<UserResponseDTO> list(
      @Parameter(description = "Filtrar por status") @RequestParam(required = false)
          UserStatus status,
      @Parameter(description = "Filtrar por unidade") @RequestParam(required = false) Long unitId,
      @Parameter(description = "Incluir usuários inativos (padrão: false)")
          @RequestParam(defaultValue = "false")
          boolean includeInactive,
      @ParameterObject Pageable pageable) {

    Page<User> page = userQueryService.list(status, unitId, includeInactive, pageable);

    return PageResponse.from(
        page,
        page.getContent().stream().map(userMapper::toResponseDTO).collect(Collectors.toList()));
  }

  @Operation(summary = "Criar novo usuário")
  @PreAuthorize("hasRole('ADMIN')")
  @PostMapping
  public ResponseEntity<UserResponseDTO> createUser(@RequestBody @Valid UserCreateDTO dto) {
    Organization organization = organizationService.findById(dto.getOrganizationId());
    Unit unit = unitService.findById(dto.getUnitId());
    User user =
        userService.createUser(
            dto.getName(),
            dto.getEmail(),
            null,
            dto.getRole(),
            organization,
            unit,
            dto.getDocumentNumber(),
            dto.getPhoneNumber());
    return ResponseEntity.status(HttpStatus.CREATED).body(userMapper.toResponseDTO(user));
  }

  @Operation(summary = "Buscar usuário por ID")
  @PreAuthorize("hasRole('ADMIN')")
  @GetMapping("/{id}")
  public UserResponseDTO findById(@PathVariable Long id) {
    return userMapper.toResponseDTO(userService.findById(id));
  }

  @Operation(summary = "Bloquear usuário")
  @PreAuthorize("hasRole('ADMIN')")
  @PatchMapping("/{id}/block")
  public void blockUser(@PathVariable Long id) {
    userService.blockUser(id);
  }

  @Operation(summary = "Ativar usuário")
  @PreAuthorize("hasRole('ADMIN')")
  @PatchMapping("/{id}/activate")
  public void activateUser(@PathVariable Long id) {
    userService.activateUser(id);
  }

  @Operation(summary = "Inativar usuário")
  @PreAuthorize("hasRole('ADMIN')")
  @PatchMapping("/{id}/inactivate")
  public void inactivateUser(@PathVariable Long id) {
    userService.inactivateUser(id);
  }
}
