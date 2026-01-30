package com.portfolio.asset_management.user.service;

import com.portfolio.asset_management.organization.entity.Organization;
import com.portfolio.asset_management.security.enums.UserRole;
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

  public UserService(UserRepository userRepository) {
    this.userRepository = userRepository;
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

    return userRepository.save(user);
  }

  public User findById(Long id) {
    return userRepository
        .findById(id)
        .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
  }

  public User findByEmail(String email) {
    return userRepository
        .findByEmail(email)
        .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
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
      throw new RuntimeException("Já existe um usuário com este email");
    }
  }
}
