package com.portfolio.asset_management.user.service;

import com.portfolio.asset_management.audit.enums.AuditEventType;
import com.portfolio.asset_management.audit.service.AuditService;
import com.portfolio.asset_management.organization.entity.Organization;
import com.portfolio.asset_management.security.enums.UserRole;
import com.portfolio.asset_management.shared.exception.BusinessException;
import com.portfolio.asset_management.shared.exception.NotFoundException;
import com.portfolio.asset_management.unit.entity.Unit;
import com.portfolio.asset_management.user.entity.User;
import com.portfolio.asset_management.user.enums.UserStatus;
import com.portfolio.asset_management.user.repository.UserRepository;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

  private final UserRepository userRepository;
  private final AuditService auditService;

  public UserService(UserRepository userRepository, AuditService auditService) {
    this.userRepository = userRepository;
    this.auditService = auditService;
  }

  @Transactional
  public User createUser(
      String name,
      String email,
      String passwordHash,
      UserRole role,
      Organization organization,
      Unit unit,
      String documentNumber) {

    validateEmailUniqueness(email);

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

  public User findById(Long id) {

    return userRepository
        .findById(id)
        .orElseThrow(() -> new NotFoundException("Usuário não encontrado"));
  }

  public User findByEmail(String email) {

    return userRepository
        .findByEmail(email)
        .orElseThrow(() -> new NotFoundException("Usuário não encontrado"));
  }

  @Transactional
  public void acceptLgpd(Long userId) {

    User user = findById(userId);

    user.acceptLgpd();
  }

  @Transactional
  public void activateUser(Long userId) {

    User user = findById(userId);

    if (user.getStatus() == UserStatus.ACTIVE) {
      throw new BusinessException("Usuário já está ativo");
    }

    user.setStatus(UserStatus.ACTIVE);

    auditService.registerEvent(
        AuditEventType.USER_STATUS_CHANGED,
        null,
        user.getOrganization().getId(),
        user.getUnit().getId(),
        user.getId(),
        "User activated");
  }

  @Transactional
  public void blockUser(Long userId) {

    User user = findById(userId);

    if (user.getStatus() == UserStatus.BLOCKED) {
      throw new BusinessException("Usuário já está bloqueado");
    }

    user.setStatus(UserStatus.BLOCKED);

    auditService.registerEvent(
        AuditEventType.USER_STATUS_CHANGED,
        null,
        user.getOrganization().getId(),
        user.getUnit().getId(),
        user.getId(),
        "User blocked");
  }

  @Transactional
  public void inactivateUser(Long userId) {

    User user = findById(userId);

    if (user.getStatus() == UserStatus.INACTIVE) {
      throw new BusinessException("Usuário já está inativo");
    }

    user.setStatus(UserStatus.INACTIVE);

    auditService.registerEvent(
        AuditEventType.USER_STATUS_CHANGED,
        null,
        user.getOrganization().getId(),
        user.getUnit().getId(),
        user.getId(),
        "User inactivated");
  }

  private void validateEmailUniqueness(String email) {

    Optional<User> existing = userRepository.findByEmail(email);

    if (existing.isPresent()) {
      throw new BusinessException("Já existe um usuário com este email");
    }
  }
}
