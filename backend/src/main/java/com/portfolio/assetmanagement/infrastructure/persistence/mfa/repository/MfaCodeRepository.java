package com.portfolio.assetmanagement.infrastructure.persistence.mfa.repository;

import com.portfolio.assetmanagement.domain.mfa.entity.MfaCode;
import java.time.Instant;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MfaCodeRepository extends JpaRepository<MfaCode, Long> {

  /** Busca o código MFA mais recente e não usado de um usuário. */
  @Query(
      """
      SELECT m FROM MfaCode m
      WHERE m.userId = :userId
        AND m.used = false
        AND m.expiresAt > :now
      ORDER BY m.createdAt DESC
      LIMIT 1
      """)
  Optional<MfaCode> findValidByUserId(@Param("userId") Long userId, @Param("now") Instant now);

  /** Remove todos os códigos expirados (chamado por scheduler). */
  @Modifying
  @Query("DELETE FROM MfaCode m WHERE m.expiresAt < :now")
  void deleteExpired(@Param("now") Instant now);

  /** Invalida todos os códigos pendentes de um usuário (antes de gerar novo). */
  @Modifying
  @Query("DELETE FROM MfaCode m WHERE m.userId = :userId AND m.used = false")
  void deleteAllPendingByUserId(@Param("userId") Long userId);
}
