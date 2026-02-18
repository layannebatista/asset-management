package com.portfolio.assetmanagement.infrastructure.persistence.user.repository;

import com.portfolio.assetmanagement.domain.organization.entity.Organization;
import com.portfolio.assetmanagement.domain.unit.entity.Unit;
import com.portfolio.assetmanagement.domain.user.entity.User;
import com.portfolio.assetmanagement.domain.user.enums.UserStatus;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repositório responsável pelo acesso a dados da entidade User.
 *
 * <p>Centraliza persistência e consultas de usuários com suporte multi-tenant.
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

  /** Busca usuário por email. */
  Optional<User> findByEmail(String email);

  /** Verifica existência por email. */
  boolean existsByEmail(String email);

  /** Lista usuários por organization. */
  List<User> findByOrganization(Organization organization);

  /** Lista usuários por unit. */
  List<User> findByUnit(Unit unit);

  /** Busca usuário por email e organization. */
  Optional<User> findByEmailAndOrganization(String email, Organization organization);

  /** Verifica existência por id e organization. */
  boolean existsByIdAndOrganization(Long userId, Organization organization);

  /** Busca usuário por id e organization. */
  Optional<User> findByIdAndOrganization(Long userId, Organization organization);

  /** Lista usuários por organization e status. */
  List<User> findByOrganizationAndStatus(Organization organization, UserStatus status);

  /** Verifica existência por email e status. */
  boolean existsByEmailAndStatus(String email, UserStatus status);

  /** Busca usuário por email e status. */
  Optional<User> findByEmailAndStatus(String email, UserStatus status);
}