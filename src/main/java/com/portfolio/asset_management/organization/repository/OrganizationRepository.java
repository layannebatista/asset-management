package com.portfolio.asset_management.organization.repository;

import com.portfolio.asset_management.organization.entity.Organization;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repositório responsável pelo acesso a dados da entidade Organization.
 *
 * <p>Centraliza operações de persistência e consulta relacionadas às organizações do sistema.
 */
@Repository
public interface OrganizationRepository extends JpaRepository<Organization, Long> {

  Optional<Organization> findByName(String name);
}
