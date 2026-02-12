package com.portfolio.asset_management.unit.repository;

import com.portfolio.asset_management.organization.entity.Organization;
import com.portfolio.asset_management.unit.entity.Unit;
import com.portfolio.asset_management.unit.enums.UnitStatus;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repositório responsável pelo acesso a dados da entidade Unit.
 *
 * <p>Centraliza persistência e consultas das unidades (filiais).
 */
@Repository
public interface UnitRepository extends JpaRepository<Unit, Long> {

  /** Lista unidades de uma organização. */
  List<Unit> findByOrganization(Organization organization);

  /** Busca unidade principal da organização. */
  Optional<Unit> findByOrganizationAndMainUnitTrue(Organization organization);

  /** Verifica se já existe unidade principal. */
  boolean existsByOrganizationAndMainUnitTrue(Organization organization);

  /** Lista unidades ativas da organização. */
  List<Unit> findByOrganizationAndStatus(Organization organization, UnitStatus status);

  /** Verifica se unidade pertence à organização. */
  boolean existsByIdAndOrganization(Long unitId, Organization organization);

  /** Busca unidade por id e organization. */
  Optional<Unit> findByIdAndOrganization(Long unitId, Organization organization);

  /** Verifica existência por id e status. */
  boolean existsByIdAndStatus(Long unitId, UnitStatus status);
}
