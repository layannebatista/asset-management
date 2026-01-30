package com.portfolio.asset_management.unit.repository;

import com.portfolio.asset_management.organization.entity.Organization;
import com.portfolio.asset_management.unit.entity.Unit;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repositório responsável pelo acesso a dados da entidade Unit.
 *
 * <p>Centraliza operações de persistência e consulta relacionadas às unidades (filiais) das
 * organizações.
 */
@Repository
public interface UnitRepository extends JpaRepository<Unit, Long> {

  List<Unit> findByOrganization(Organization organization);

  Optional<Unit> findByOrganizationAndMainUnitTrue(Organization organization);
}
