package com.portfolio.asset_management.user.service;

import com.portfolio.asset_management.audit.enums.AuditEventType;
import com.portfolio.asset_management.audit.service.AuditService;
import com.portfolio.asset_management.organization.entity.Organization;
import com.portfolio.asset_management.security.enums.UserRole;
import com.portfolio.asset_management.shared.exception.BusinessException;
import com.portfolio.asset_management.unit.entity.Unit;
import com.portfolio.asset_management.user.entity.User;
import com.portfolio.asset_management.user.enums.UserStatus;
import com.portfolio.asset_management.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

  private final UserRepository userRepository;
  private final AuditService auditService;
  private final UserValidationService userValidationService;

  public UserService(
      UserRepository userRepository,
      AuditService auditService,
      UserValidationService userValidationService) {

    this.userRepository = userRepository;
    this.auditService = auditService;
    this.userValidationService = userValidationService;
  }

  /** Cria novo usuário. */
  @Transactional
  public User createUser(
      String name,
      String email,
      String passwordHash,
      UserRole role,
      Organization organization,
      Unit unit,
      String documentNumber) {

    userValidationService.validateEmail(email);

    userValidationService.validateEmailUniqueness(email);

    userValidationService.validateOrganizationUnitIntegrity(organization, unit);

    User user = new User(name, email, passwordHash, role, organization, unit, documentNumber);

    User saved = userRepository.save(user);

    auditService.registerEvent(
        AuditEventType.USER_CREATED,
        null,
        organization.getId(),
        unit.getId(),
        saved.getId(),
        "User created");

    return saved;
  }

  /** Busca usuário por ID. */
  public User findById(Long id) {

    return userValidationService.requireExisting(id);
  }

  /** Busca usuário por email. */
  public User findByEmail(String email) {

    return userValidationService.requireExistingByEmail(email);
  }

  /** Aceite LGPD. */
  @Transactional
  public void acceptLgpd(Long userId) {

    User user = userValidationService.requireExisting(userId);

    user.acceptLgpd();

    auditService.registerEvent(
        AuditEventType.USER_LGPD_ACCEPTED,
        user.getId(),
        user.getOrganization().getId(),
        user.getUnit().getId(),
        user.getId(),
        "LGPD accepted");
  }

  /** Ativa usuário. */
  @Transactional
  public void activateUser(Long userId) {

    User user = userValidationService.requireExisting(userId);

    if (user.getStatus() == UserStatus.ACTIVE) {

      throw new BusinessException("Usuário já está ativo");
    }

    user.activate();

    auditService.registerEvent(
        AuditEventType.USER_STATUS_CHANGED,
        user.getId(),
        user.getOrganization().getId(),
        user.getUnit().getId(),
        user.getId(),
        "User activated");
  }

  /** Bloqueia usuário. */
  @Transactional
  public void blockUser(Long userId) {

    User user = userValidationService.requireExisting(userId);

    if (user.getStatus() == UserStatus.BLOCKED) {

      throw new BusinessException("Usuário já está bloqueado");
    }

    user.block();

    auditService.registerEvent(
        AuditEventType.USER_STATUS_CHANGED,
        user.getId(),
        user.getOrganization().getId(),
        user.getUnit().getId(),
        user.getId(),
        "User blocked");
  }

  /** Inativa usuário. */
  @Transactional
  public void inactivateUser(Long userId) {

    User user = userValidationService.requireExisting(userId);

    if (user.getStatus() == UserStatus.INACTIVE) {

      throw new BusinessException("Usuário já está inativo");
    }

    user.inactivate();

    auditService.registerEvent(
        AuditEventType.USER_STATUS_CHANGED,
        user.getId(),
        user.getOrganization().getId(),
        user.getUnit().getId(),
        user.getId(),
        "User inactivated");
  }
}
