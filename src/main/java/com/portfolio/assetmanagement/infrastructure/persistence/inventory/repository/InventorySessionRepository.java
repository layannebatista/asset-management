package com.portfolio.assetmanagement.infrastructure.persistence.inventory.repository;

import com.portfolio.assetmanagement.domain.inventory.entity.InventorySession;
import com.portfolio.assetmanagement.domain.inventory.enums.InventoryStatus;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface InventorySessionRepository extends JpaRepository<InventorySession, Long> {

  /** Lista sessões por organization. */
  List<InventorySession> findByOrganization_Id(Long organizationId);

  /** Lista sessões por unit. */
  List<InventorySession> findByUnit_Id(Long unitId);

  /** Busca sessões ativas (OPEN ou IN_PROGRESS). */
  List<InventorySession> findByUnit_IdAndStatusIn(Long unitId, List<InventoryStatus> statuses);

  /** Busca sessão ativa única. */
  Optional<InventorySession> findFirstByUnit_IdAndStatusIn(
      Long unitId, List<InventoryStatus> statuses);

  /** Verifica existência de sessão ativa. */
  boolean existsByUnit_IdAndStatusIn(Long unitId, List<InventoryStatus> statuses);

  /** Verifica existência de sessão ativa na organization. */
  boolean existsByOrganization_IdAndUnit_IdAndStatusIn(
      Long organizationId, Long unitId, List<InventoryStatus> statuses);
}