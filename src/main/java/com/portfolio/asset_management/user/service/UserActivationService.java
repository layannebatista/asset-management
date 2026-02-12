package com.portfolio.asset_management.user.service;

import com.portfolio.asset_management.audit.enums.AuditEventType;
import com.portfolio.asset_management.audit.service.AuditService;
import com.portfolio.asset_management.shared.exception.BusinessException;
import com.portfolio.asset_management.shared.exception.NotFoundException;
import com.portfolio.asset_management.user.entity.User;
import com.portfolio.asset_management.user.entity.UserActivationToken;
import com.portfolio.asset_management.user.entity.UserConsent;
import com.portfolio.asset_management.user.enums.UserStatus;
import com.portfolio.asset_management.user.repository.UserActivationTokenRepository;
import com.portfolio.asset_management.user.repository.UserConsentRepository;
import com.portfolio.asset_management.user.repository.UserRepository;
import java.time.Instant;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserActivationService {

  private static final long TOKEN_EXPIRATION_SECONDS = 60 * 60 * 24; // 24 horas

  private final UserRepository userRepository;

  private final UserActivationTokenRepository tokenRepository;

  private final UserConsentRepository consentRepository;

  private final PasswordEncoder passwordEncoder;

  private final AuditService auditService;

  public UserActivationService(
      UserRepository userRepository,
      UserActivationTokenRepository tokenRepository,
      UserConsentRepository consentRepository,
      PasswordEncoder passwordEncoder,
      AuditService auditService) {

    this.userRepository = userRepository;
    this.tokenRepository = tokenRepository;
    this.consentRepository = consentRepository;
    this.passwordEncoder = passwordEncoder;
    this.auditService = auditService;
  }

  /** Gera token de ativação. */
  @Transactional
  public String generateActivationToken(Long userId) {

    User user =
        userRepository
            .findById(userId)
            .orElseThrow(() -> new NotFoundException("Usuário não encontrado"));

    if (user.getStatus() != UserStatus.PENDING_ACTIVATION) {

      throw new BusinessException("Usuário não está pendente de ativação");
    }

    tokenRepository.deleteByUser(user);

    UserActivationToken token = new UserActivationToken(user, TOKEN_EXPIRATION_SECONDS);

    tokenRepository.save(token);

    return token.getToken();
  }

  /** Ativa usuário usando token. */
  @Transactional
  public void activateUser(
      String tokenValue, String password, String confirmPassword, boolean lgpdAccepted) {

    UserActivationToken token =
        tokenRepository
            .findByToken(tokenValue)
            .orElseThrow(() -> new NotFoundException("Token inválido"));

    if (!token.isValid()) {

      throw new BusinessException("Token expirado ou já utilizado");
    }

    User user = token.getUser();

    if (user.getStatus() != UserStatus.PENDING_ACTIVATION) {

      throw new BusinessException("Usuário não está pendente de ativação");
    }

    if (password == null || password.isBlank()) {

      throw new BusinessException("Senha é obrigatória");
    }

    if (!password.equals(confirmPassword)) {

      throw new BusinessException("Senhas não conferem");
    }

    if (!lgpdAccepted) {

      throw new BusinessException("LGPD deve ser aceita");
    }

    user.changePassword(passwordEncoder.encode(password));

    user.activate();

    user.acceptLgpd();

    consentRepository.save(new UserConsent(user.getId()));

    token.markAsUsed();

    auditService.registerEvent(
        AuditEventType.USER_STATUS_CHANGED,
        user.getId(),
        user.getOrganization().getId(),
        user.getUnit().getId(),
        user.getId(),
        "User activated via token");
  }

  /** Limpeza de tokens expirados. */
  @Transactional
  public void deleteExpiredTokens() {

    tokenRepository.deleteByExpiresAtBefore(Instant.now());
  }
}
