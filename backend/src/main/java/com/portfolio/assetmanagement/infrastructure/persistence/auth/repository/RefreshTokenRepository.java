package com.portfolio.assetmanagement.infrastructure.persistence.auth.repository;

import com.portfolio.assetmanagement.domain.auth.entity.RefreshToken;
import java.time.Instant;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

  Optional<RefreshToken> findByToken(String token);

  /** Revoga todos os tokens ativos do usuário (usado no logout e no bloqueio). */
  @Modifying
  @Query(
      "UPDATE RefreshToken r SET r.revoked = true WHERE r.userId = :userId AND r.revoked = false")
  void revokeAllByUserId(@Param("userId") Long userId);

  /** Remove tokens expirados (scheduler periódico). */
  @Modifying
  @Query("DELETE FROM RefreshToken r WHERE r.expiresAt < :now")
  void deleteExpired(@Param("now") Instant now);
}
