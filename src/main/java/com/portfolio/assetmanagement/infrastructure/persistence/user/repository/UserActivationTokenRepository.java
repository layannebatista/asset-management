package com.portfolio.assetmanagement.infrastructure.persistence.user.repository;

import com.portfolio.assetmanagement.domain.user.entity.User;
import com.portfolio.assetmanagement.domain.user.entity.UserActivationToken;
import java.time.Instant;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/** Repositório responsável por persistir e consultar tokens de ativação de usuário. */
@Repository
public interface UserActivationTokenRepository extends JpaRepository<UserActivationToken, Long> {

  /** Busca token pelo valor. */
  Optional<UserActivationToken> findByToken(String token);

  /** Busca token válido pelo valor. */
  Optional<UserActivationToken> findByTokenAndUsedFalse(String token);

  /** Verifica se token existe. */
  boolean existsByToken(String token);

  /** Verifica se usuário possui token não utilizado. */
  boolean existsByUserAndUsedFalse(User user);

  /** Busca token ativo do usuário. */
  Optional<UserActivationToken> findByUserAndUsedFalse(User user);

  /** Remove tokens expirados. */
  void deleteByExpiresAtBefore(Instant instant);

  /** Remove tokens de um usuário. */
  void deleteByUser(User user);
}
