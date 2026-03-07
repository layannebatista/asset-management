package com.portfolio.assetmanagement.security.service;

import com.portfolio.assetmanagement.domain.auth.entity.RefreshToken;
import com.portfolio.assetmanagement.infrastructure.persistence.auth.repository.RefreshTokenRepository;
import com.portfolio.assetmanagement.shared.exception.BusinessException;
import java.time.Instant;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Gerencia refresh tokens para renovação de JWT sem relogin.
 *
 * <p>Fluxo de rotação:
 *
 * <ol>
 *   <li>Login bem-sucedido → emite access token (1h) + refresh token (7d)
 *   <li>Access token expira → cliente envia refresh token para {@code POST /auth/refresh}
 *   <li>Refresh token válido → novo access token + novo refresh token emitidos
 *   <li>Refresh token usado é revogado imediatamente (rotação)
 *   <li>Logout → revoga todos os refresh tokens do usuário
 * </ol>
 */
@Service
public class RefreshTokenService {

  @Value("${security.jwt.refresh-expiration:604800}") // 7 dias em segundos
  private long refreshExpirationSeconds;

  private final RefreshTokenRepository repository;

  public RefreshTokenService(RefreshTokenRepository repository) {
    this.repository = repository;
  }

  /** Gera e persiste um novo refresh token para o usuário. */
  @Transactional
  public RefreshToken generate(Long userId) {
    RefreshToken token = new RefreshToken(userId, refreshExpirationSeconds);
    return repository.save(token);
  }

  /**
   * Valida o token recebido e o revoga (rotação).
   *
   * @return RefreshToken validado (userId disponível para emitir novo JWT)
   * @throws BusinessException se inválido ou expirado
   */
  @Transactional
  public RefreshToken validateAndRotate(String rawToken) {
    RefreshToken token =
        repository
            .findByToken(rawToken)
            .orElseThrow(() -> new BusinessException("Refresh token inválido"));

    if (!token.isValid()) {
      throw new BusinessException("Refresh token expirado ou revogado");
    }

    // Rotação: revoga o atual antes de retornar
    token.revoke();

    return token;
  }

  /** Revoga todos os tokens do usuário (logout e bloqueio de conta). */
  @Transactional
  public void revokeAll(Long userId) {
    repository.revokeAllByUserId(userId);
  }

  /** Remove tokens expirados — chamado por scheduler. */
  @Transactional
  public void purgeExpired() {
    repository.deleteExpired(Instant.now());
  }
}
