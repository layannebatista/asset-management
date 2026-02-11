package com.portfolio.asset_management.user.service;

import com.portfolio.asset_management.shared.exception.BusinessException;
import com.portfolio.asset_management.shared.exception.NotFoundException;
import com.portfolio.asset_management.user.entity.User;
import com.portfolio.asset_management.user.entity.UserConsent;
import com.portfolio.asset_management.user.enums.UserStatus;
import com.portfolio.asset_management.user.repository.UserConsentRepository;
import com.portfolio.asset_management.user.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserActivationService {

  private final UserRepository userRepository;
  private final UserConsentRepository consentRepository;
  private final PasswordEncoder passwordEncoder;

  public UserActivationService(
      UserRepository userRepository,
      UserConsentRepository consentRepository,
      PasswordEncoder passwordEncoder) {

    this.userRepository = userRepository;
    this.consentRepository = consentRepository;
    this.passwordEncoder = passwordEncoder;
  }

  @Transactional
  public void activateUser(
      Long userId, String password, String confirmPassword, boolean lgpdAccepted) {

    User user =
        userRepository
            .findById(userId)
            .orElseThrow(() -> new NotFoundException("Usuário não encontrado"));

    if (!password.equals(confirmPassword)) {
      throw new BusinessException("Senhas não conferem");
    }

    if (!lgpdAccepted) {
      throw new BusinessException("LGPD deve ser aceita");
    }

    user.changePassword(passwordEncoder.encode(password));
    user.setStatus(UserStatus.ACTIVE);

    consentRepository.save(new UserConsent(userId));
  }
}
