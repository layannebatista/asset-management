package com.portfolio.assetmanagement.shared.scheduler;

import com.portfolio.assetmanagement.application.mfa.service.MfaService;
import com.portfolio.assetmanagement.application.user.service.UserActivationService;
import com.portfolio.assetmanagement.security.service.RefreshTokenService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Tarefas agendadas do sistema.
 *
 * <p>Executadas automaticamente pelo Spring Scheduler. Todas as operações são idempotentes e
 * seguras para re-execução.
 */
@Component
@EnableScheduling
public class SchedulerService {

  private static final Logger log = LoggerFactory.getLogger(SchedulerService.class);

  private final MfaService mfaService;
  private final RefreshTokenService refreshTokenService;
  private final UserActivationService userActivationService;

  public SchedulerService(
      MfaService mfaService,
      RefreshTokenService refreshTokenService,
      UserActivationService userActivationService) {
    this.mfaService = mfaService;
    this.refreshTokenService = refreshTokenService;
    this.userActivationService = userActivationService;
  }

  /** Remove códigos MFA expirados a cada 10 minutos. Mantém a tabela mfa_codes enxuta. */
  @Scheduled(fixedRate = 600_000)
  public void purgeExpiredMfaCodes() {
    try {
      mfaService.purgeExpired();
      log.debug("Scheduler: MFA codes expirados removidos");
    } catch (Exception e) {
      log.error("Scheduler: falha ao remover MFA codes expirados", e);
    }
  }

  /** Remove refresh tokens expirados a cada hora. */
  @Scheduled(fixedRate = 3_600_000)
  public void purgeExpiredRefreshTokens() {
    try {
      refreshTokenService.purgeExpired();
      log.debug("Scheduler: Refresh tokens expirados removidos");
    } catch (Exception e) {
      log.error("Scheduler: falha ao remover refresh tokens expirados", e);
    }
  }

  /** Remove tokens de ativação de usuário expirados a cada hora. */
  @Scheduled(fixedRate = 3_600_000)
  public void purgeExpiredActivationTokens() {
    try {
      userActivationService.deleteExpiredTokens();
      log.debug("Scheduler: tokens de ativação expirados removidos");
    } catch (Exception e) {
      log.error("Scheduler: falha ao remover tokens de ativação expirados", e);
    }
  }
}
