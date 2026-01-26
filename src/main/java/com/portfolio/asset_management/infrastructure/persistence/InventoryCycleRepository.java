package com.portfolio.asset_management.infrastructure.persistence;

import com.portfolio.asset_management.domain.inventory.InventoryCycle;
import com.portfolio.asset_management.domain.inventory.InventoryStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repositório responsável pela persistência
 * dos ciclos de inventário.
 *
 * NÃO contém regra de negócio.
 */
@Repository
public interface InventoryCycleRepository extends JpaRepository<InventoryCycle, UUID> {

    /**
     * Verifica se já existe um ciclo ABERTO
     * para a unidade informada.
     */
    boolean existsByUnitIdAndStatus(UUID unitId, InventoryStatus status);

    /**
     * Busca o ciclo ABERTO da unidade, se existir.
     */
    Optional<InventoryCycle> findByUnitIdAndStatus(UUID unitId, InventoryStatus status);

    /**
     * Lista ciclos por status.
     */
    List<InventoryCycle> findAllByStatus(InventoryStatus status);

    /**
     * Lista todos os ciclos de uma unidade.
     */
    List<InventoryCycle> findAllByUnitId(UUID unitId);
}
