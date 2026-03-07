package com.portfolio.assetmanagement.application.mfa.service;

import com.portfolio.assetmanagement.application.whatsapp.service.WhatsAppService;
import com.portfolio.assetmanagement.domain.mfa.entity.MfaCode;
import com.portfolio.assetmanagement.infrastructure.persistence.mfa.repository.MfaCodeRepository;
import com.portfolio.assetmanagement.shared.exception.BusinessException;
import java.time.Instant;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Serviço responsável por gerar, enviar e validar os códigos MFA (OTP).
 *
 * <p>Fluxo:
 *
 * <ol>
 *   <li>Login com email+senha → {@code AuthService} chama {@code initiateMfa} se usuário tem phone
 *   <li>Backend retorna {@code mfaRequired: true} + {@code userId} (sem JWT ainda)
 *   <li>Frontend exibe tela de código MFA
 *   <li>Usuário digita o código → frontend chama {@code POST /auth/mfa/verify}
 *   <li>{@code validateAndIssueToken} valida o código e retorna o JWT real
 * </ol>
 */
@Service
public class MfaService {

  @Value("${app.mfa.expiration-seconds:300}")
  private long expirationSeconds;

  @Value("${app.mfa.code-length:6}")
  private int codeLength;

  private final MfaCodeRepository mfaCodeRepository;
  private final WhatsAppService whatsAppService;

  public MfaService(MfaCodeRepository mfaCodeRepository, WhatsAppService whatsAppService) {
    this.mfaCodeRepository = mfaCodeRepository;
    this.whatsAppService = whatsAppService;
  }

  /**
   * Gera um novo código OTP e o envia via WhatsApp.
   *
   * <p>Invalida qualquer código anterior pendente do mesmo usuário antes de gerar o novo.
   *
   * @param userId ID do usuário
   * @param phoneNumber número no formato E.164 sem '+' (ex: 5511999998888)
   */
  @Transactional
  public void generateAndSend(Long userId, String phoneNumber) {

    // Invalida código anterior para evitar múltiplos códigos válidos simultâneos
    mfaCodeRepository.deleteAllPendingByUserId(userId);

    MfaCode mfaCode = new MfaCode(userId, codeLength, expirationSeconds);
    mfaCodeRepository.save(mfaCode);

    // Envio assíncrono — não bloqueia nem reverte a transação
    whatsAppService.sendMfaCode(phoneNumber, mfaCode.getCode());
  }

  /**
   * Valida o código MFA informado pelo usuário.
   *
   * @param userId ID do usuário que está se autenticando
   * @param code código de 6 dígitos digitado pelo usuário
   * @throws BusinessException se o código for inválido ou expirado
   */
  @Transactional
  public void validate(Long userId, String code) {

    MfaCode mfaCode =
        mfaCodeRepository
            .findValidByUserId(userId, Instant.now())
            .orElseThrow(() -> new BusinessException("Código MFA inválido ou expirado"));

    if (!mfaCode.getCode().equals(code)) {
      throw new BusinessException("Código MFA incorreto");
    }

    mfaCode.markAsUsed();
  }

  /** Remove códigos expirados — deve ser chamado por scheduler periódico. */
  @Transactional
  public void purgeExpired() {
    mfaCodeRepository.deleteExpired(Instant.now());
  }
}
