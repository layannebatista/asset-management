package com.portfolio.asset_management.user.service;

import com.portfolio.asset_management.organization.entity.Organization;
import com.portfolio.asset_management.shared.exception.BusinessException;
import com.portfolio.asset_management.shared.exception.NotFoundException;
import com.portfolio.asset_management.unit.entity.Unit;
import com.portfolio.asset_management.unit.service.UnitValidationService;
import com.portfolio.asset_management.user.entity.User;
import com.portfolio.asset_management.user.repository.UserRepository;
import java.util.Optional;
import java.util.regex.Pattern;
import org.springframework.stereotype.Service;

/**
 * Serviço responsável por validações centralizadas de User.
 *
 * <p>Garante integridade multi-tenant e consistência enterprise.
 */
@Service
public class UserValidationService {

  private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$");

  private final UserRepository userRepository;
  private final UnitValidationService unitValidationService;

  public UserValidationService(
      UserRepository userRepository, UnitValidationService unitValidationService) {

    this.userRepository = userRepository;
    this.unitValidationService = unitValidationService;
  }

  /** Valida email obrigatório e formato. */
  public void validateEmail(String email) {

    if (email == null || email.isBlank()) {

      throw new BusinessException("Email é obrigatório");
    }

    if (email.length() > 255) {

      throw new BusinessException("Email não pode exceder 255 caracteres");
    }

    if (!EMAIL_PATTERN.matcher(email).matches()) {

      throw new BusinessException("Formato de email inválido");
    }
  }

  /** Garante unicidade global do email. */
  public void validateEmailUniqueness(String email) {

    if (userRepository.existsByEmail(email)) {

      throw new BusinessException("Já existe um usuário com este email");
    }
  }

  /** Garante existência do usuário. */
  public User requireExisting(Long userId) {

    if (userId == null) {

      throw new IllegalArgumentException("userId não pode ser null");
    }

    return userRepository
        .findById(userId)
        .orElseThrow(() -> new NotFoundException("Usuário não encontrado"));
  }

  /** Valida integridade organization ↔ unit. */
  public void validateOrganizationUnitIntegrity(Organization organization, Unit unit) {

    if (organization == null || organization.getId() == null) {

      throw new IllegalArgumentException("organization é obrigatório");
    }

    if (unit == null || unit.getId() == null) {

      throw new IllegalArgumentException("unit é obrigatório");
    }

    unitValidationService.validateOwnership(unit, organization);
  }

  /** Busca usuário por email. */
  public User requireExistingByEmail(String email) {

    validateEmail(email);

    Optional<User> user = userRepository.findByEmail(email);

    return user.orElseThrow(() -> new NotFoundException("Usuário não encontrado"));
  }

  /** Garante que usuário pertence à organization. */
  public void validateOwnership(User user, Organization organization) {

    if (!user.getOrganization().getId().equals(organization.getId())) {

      throw new BusinessException("Usuário não pertence à organização informada");
    }
  }
}
