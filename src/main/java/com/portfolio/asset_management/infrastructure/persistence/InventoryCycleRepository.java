package com.portfolio.asset_management.infrastructure.persistence;

import com.portfolio.asset_management.domain.inventory.InventoryCycle;
import com.portfolio.asset_management.domain.inventory.InventoryStatus;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repositório do Aggregate Root InventoryCycle.
 *
 * <p>Responsável apenas por persistência.
 * NÃO contém regras de negócio.
 */
@Repository
public interface InventoryCycleRepository
    extends JpaRepository<InventoryCycle, UUID> {

  /**
   * Lista ciclos por status.
   * Usado apenas para consultas.
   */
  List<InventoryCycle> findAllByStatus(InventoryStatus status);
}
