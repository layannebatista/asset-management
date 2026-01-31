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

/**
 * Service responsável pelas regras de negócio relacionadas aos usuários.
 *
 * <p>Centraliza a criação, ativação, bloqueio e validações do ciclo de vida do usuário no sistema.
 */
@Service
public class UserService {

  private final UserRepository userRepository;
  private final AuditService auditService;

  public UserService(UserRepository userRepository, AuditService auditService) {
    this.userRepository = userRepository;
    this.auditService = auditService;
  }

  /**
   * Cria um usuário internamente (por administrador).
   *
   * <p>O usuário é criado com status PENDING_ACTIVATION e deve aceitar os termos de LGPD no
   * primeiro acesso.
   */
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

    // Auditoria – criação de usuário
    auditService.registerEvent(
        AuditEventType.USER_CREATED,
        null, // ação administrativa / sistema
        organization.getId(), // organizationId
        unit.getId(), // unitId
        saved.getId(), // targetId
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
    user.setStatus(UserStatus.ACTIVE);
  }

  @Transactional
  public void blockUser(Long userId) {
    User user = findById(userId);
    user.setStatus(UserStatus.BLOCKED);
  }

  @Transactional
  public void inactivateUser(Long userId) {
    User user = findById(userId);
    user.setStatus(UserStatus.INACTIVE);
  }

  private void validateEmailUniqueness(String email) {
    Optional<User> existing = userRepository.findByEmail(email);
    if (existing.isPresent()) {
      throw new BusinessException("Já existe um usuário com este email");
    }
  }
}
