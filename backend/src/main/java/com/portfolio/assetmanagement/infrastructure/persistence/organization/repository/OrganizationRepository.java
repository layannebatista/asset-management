package com.portfolio.assetmanagement.infrastructure.persistence.organization.repository;

import com.portfolio.assetmanagement.domain.organization.entity.Organization;
import com.portfolio.assetmanagement.domain.organization.enums.OrganizationStatus;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repositório responsável pelo acesso a dados da entidade Organization.
 *
 * <p>Centraliza todas as operações de persistência e consulta relacionadas ao tenant.
 */
@Repository
public interface OrganizationRepository extends JpaRepository<Organization, Long> {

  /** Busca organization pelo nome. */
  Optional<Organization> findByName(String name);

  /** Verifica se já existe organization com nome. */
  boolean existsByName(String name);

  /** Busca organization ativa pelo id. */
  Optional<Organization> findByIdAndStatus(Long id, OrganizationStatus status);

  /** Verifica se organization existe e está ativa. */
  boolean existsByIdAndStatus(Long id, OrganizationStatus status);
}
