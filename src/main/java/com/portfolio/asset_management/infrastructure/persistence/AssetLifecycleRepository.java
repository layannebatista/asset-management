package com.portfolio.asset_management.infrastructure.persistence;

import com.portfolio.asset_management.domain.asset.AssetLifecycleEvent;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repositório de persistência dos eventos de ciclo de vida do Asset.
 *
 * Responsável por fornecer histórico e auditoria
 * das ações executadas sobre o ativo.
 *
 */
@Repository
public interface AssetLifecycleRepository
    extends JpaRepository<AssetLifecycleEvent, UUID> {

  /**
   * Retorna o histórico completo de lifecycle de um ativo,
   * ordenado cronologicamente.
   */
  List<AssetLifecycleEvent> findAllByAssetIdOrderByOccurredAtAsc(UUID assetId);
}
