package com.portfolio.assetmanagement.application.user.service;

import com.portfolio.assetmanagement.application.audit.service.AuditService;
import com.portfolio.assetmanagement.application.email.service.EmailService;
import com.portfolio.assetmanagement.application.whatsapp.service.WhatsAppService;
import com.portfolio.assetmanagement.domain.audit.enums.AuditEventType;
import com.portfolio.assetmanagement.domain.user.entity.User;
import com.portfolio.assetmanagement.domain.user.entity.UserActivationToken;
import com.portfolio.assetmanagement.domain.user.entity.UserConsent;
import com.portfolio.assetmanagement.domain.user.enums.UserStatus;
import com.portfolio.assetmanagement.infrastructure.persistence.user.repository.UserActivationTokenRepository;
import com.portfolio.assetmanagement.infrastructure.persistence.user.repository.UserConsentRepository;
import com.portfolio.assetmanagement.infrastructure.persistence.user.repository.UserRepository;
import com.portfolio.assetmanagement.shared.exception.BusinessException;
import com.portfolio.assetmanagement.shared.exception.NotFoundException;
import java.time.Instant;
import java.util.regex.Pattern;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserActivationService {

  private static final long TOKEN_EXPIRATION_SECONDS = 60 * 60 * 24;

  private static final Pattern PASSWORD_POLICY =
      Pattern.compile("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^a-zA-Z\\d]).{8,}$");

  private static final String PASSWORD_POLICY_MESSAGE =
      "A senha deve ter no mínimo 8 caracteres, incluindo maiúscula, minúscula, número e símbolo";

  @Value("${app.frontend.url}")
  private String frontendUrl;

  private final UserRepository userRepository;
  private final UserActivationTokenRepository tokenRepository;
  private final UserConsentRepository consentRepository;
  private final PasswordEncoder passwordEncoder;
  private final AuditService auditService;
  private final EmailService emailService;
  private final WhatsAppService whatsAppService;

  public UserActivationService(
      UserRepository userRepository,
      UserActivationTokenRepository tokenRepository,
      UserConsentRepository consentRepository,
      PasswordEncoder passwordEncoder,
      AuditService auditService,
      EmailService emailService,
      WhatsAppService whatsAppService) {

    this.userRepository = userRepository;
    this.tokenRepository = tokenRepository;
    this.consentRepository = consentRepository;
    this.passwordEncoder = passwordEncoder;
    this.auditService = auditService;
    this.emailService = emailService;
    this.whatsAppService = whatsAppService;
  }

  /**
   * Gera token de ativação e envia o link por e-mail e, se o usuário tiver telefone, também via
   * WhatsApp.
   */
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

    String activationLink = frontendUrl + "/ativar?token=" + token.getToken();

    // Sempre envia por e-mail
    emailService.sendActivationEmail(user.getEmail(), user.getName(), token.getToken());

    // Envia por WhatsApp também se o número estiver cadastrado
    if (user.getPhoneNumber() != null && !user.getPhoneNumber().isBlank()) {
      whatsAppService.sendActivationLink(user.getPhoneNumber(), user.getName(), activationLink);
    }

    return token.getToken();
  }

  @Transactional
  public void activateUser(
      String tokenValue, String password, String confirmPassword, boolean lgpdAccepted) {

    UserActivationToken token =
        tokenRepository
            .findByToken(tokenValue)
            .orElseThrow(() -> new NotFoundException("Token inválido"));

    if (!token.isValid()) throw new BusinessException("Token expirado ou já utilizado");

    User user = token.getUser();

    if (user.getStatus() != UserStatus.PENDING_ACTIVATION) {
      throw new BusinessException("Usuário não está pendente de ativação");
    }

    if (password == null || password.isBlank()) throw new BusinessException("Senha é obrigatória");

    if (!PASSWORD_POLICY.matcher(password).matches()) {
      throw new BusinessException(PASSWORD_POLICY_MESSAGE);
    }

    if (!password.equals(confirmPassword)) throw new BusinessException("Senhas não conferem");

    if (!lgpdAccepted) throw new BusinessException("LGPD deve ser aceita");

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

  @Transactional
  public void deleteExpiredTokens() {
    tokenRepository.deleteByExpiresAtBefore(Instant.now());
  }
}
