package com.portfolio.assetmanagement.application.user.service;

import com.portfolio.assetmanagement.application.audit.service.AuditService;
import com.portfolio.assetmanagement.application.whatsapp.service.WhatsAppService;
import com.portfolio.assetmanagement.domain.audit.enums.AuditEventType;
import com.portfolio.assetmanagement.domain.organization.entity.Organization;
import com.portfolio.assetmanagement.domain.unit.entity.Unit;
import com.portfolio.assetmanagement.domain.user.entity.User;
import com.portfolio.assetmanagement.domain.user.enums.UserStatus;
import com.portfolio.assetmanagement.infrastructure.persistence.user.repository.UserRepository;
import com.portfolio.assetmanagement.security.context.LoggedUserContext;
import com.portfolio.assetmanagement.security.enums.UserRole;
import com.portfolio.assetmanagement.shared.exception.BusinessException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

  private final UserRepository userRepository;
  private final AuditService auditService;
  private final UserValidationService userValidationService;
  private final WhatsAppService whatsAppService;
  private final LoggedUserContext loggedUser;
  private final UserActivationService userActivationService;

  public UserService(
      UserRepository userRepository,
      AuditService auditService,
      UserValidationService userValidationService,
      WhatsAppService whatsAppService,
      LoggedUserContext loggedUser,
      UserActivationService userActivationService) {

    this.userRepository = userRepository;
    this.auditService = auditService;
    this.userValidationService = userValidationService;
    this.whatsAppService = whatsAppService;
    this.loggedUser = loggedUser;
    this.userActivationService = userActivationService;
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
      String documentNumber,
      String phoneNumber) {

    userValidationService.validateEmail(email);
    userValidationService.validateEmailUniqueness(email);
    userValidationService.validateOrganizationUnitIntegrity(organization, unit);

    if (loggedUser.isOperator()) {
      throw new BusinessException("Operador não pode criar usuários");
    }

    if (loggedUser.isManager()) {
      if (loggedUser.getUnitId() == null
          || unit == null
          || !loggedUser.getUnitId().equals(unit.getId())) {
        throw new BusinessException("Gestor só pode criar usuários na própria unidade");
      }
    }

    if (!loggedUser.getOrganizationId().equals(organization.getId())) {
      throw new BusinessException("Usuário não pertence a esta organização");
    }

    if (role == UserRole.GESTOR || role == UserRole.OPERADOR) {
      if (unit == null) {
        throw new BusinessException("Usuários do tipo GESTOR e OPERADOR devem possuir uma unidade");
      }
    }

    User user = new User(name, email, passwordHash, role, organization, unit, documentNumber);

    if (phoneNumber != null && !phoneNumber.isBlank()) {
      user.updatePhoneNumber(phoneNumber);
    }

    User saved = userRepository.save(user);

    userActivationService.generateActivationToken(saved.getId());

    auditService.registerEvent(
        AuditEventType.USER_CREATED,
        loggedUser.getUserId(),
        organization.getId(),
        unit != null ? unit.getId() : null,
        saved.getId(),
        "User created");

    return saved;
  }

  @Transactional(readOnly = true)
  public User findById(Long id) {
    User user = userValidationService.requireExisting(id);
    validateAccess(user);
    return user;
  }

  @Transactional(readOnly = true)
  public User findByEmail(String email) {
    User user = userValidationService.requireExistingByEmail(email);
    validateAccess(user);
    return user;
  }

  @Transactional
  public void acceptLgpd(Long userId) {

    User user = userValidationService.requireExisting(userId);
    validateAccess(user);

    user.acceptLgpd();

    auditService.registerEvent(
        AuditEventType.USER_LGPD_ACCEPTED,
        user.getId(),
        user.getOrganization().getId(),
        user.getUnit() != null ? user.getUnit().getId() : null,
        user.getId(),
        "LGPD accepted");
  }

  @Transactional
  public void activateUser(Long userId) {

    User user = userValidationService.requireExisting(userId);
    validateAccess(user);

    if (user.getStatus() == UserStatus.ACTIVE) {
      throw new BusinessException("Usuário já está ativo");
    }

    user.activate();

    auditService.registerEvent(
        AuditEventType.USER_STATUS_CHANGED,
        user.getId(),
        user.getOrganization().getId(),
        user.getUnit() != null ? user.getUnit().getId() : null,
        user.getId(),
        "User activated");
  }

  @Transactional
  public void blockUser(Long userId) {

    User user = userValidationService.requireExisting(userId);
    validateAccess(user);

    if (user.getStatus() == UserStatus.BLOCKED) {
      throw new BusinessException("Usuário já está bloqueado");
    }

    user.block();

    auditService.registerEvent(
        AuditEventType.USER_STATUS_CHANGED,
        user.getId(),
        user.getOrganization().getId(),
        user.getUnit() != null ? user.getUnit().getId() : null,
        user.getId(),
        "User blocked");

    if (user.getPhoneNumber() != null && !user.getPhoneNumber().isBlank()) {
      whatsAppService.sendUserBlocked(user.getPhoneNumber(), user.getName());
    }
  }

  @Transactional
  public void inactivateUser(Long userId) {

    User user = userValidationService.requireExisting(userId);
    validateAccess(user);

    if (user.getStatus() == UserStatus.INACTIVE) {
      throw new BusinessException("Usuário já está inativo");
    }

    user.inactivate();

    auditService.registerEvent(
        AuditEventType.USER_STATUS_CHANGED,
        user.getId(),
        user.getOrganization().getId(),
        user.getUnit() != null ? user.getUnit().getId() : null,
        user.getId(),
        "User inactivated");
  }

  private void validateAccess(User user) {

    if (!user.getOrganization().getId().equals(loggedUser.getOrganizationId())) {
      throw new BusinessException("Acesso negado");
    }

    if (loggedUser.isManager()) {
      if (user.getUnit() == null || !user.getUnit().getId().equals(loggedUser.getUnitId())) {
        throw new BusinessException("Acesso negado");
      }
    }
  }
}
