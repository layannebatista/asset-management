package com.portfolio.asset_management.infrastructure.persistence;

import com.portfolio.asset_management.domain.asset.AssetLifecycleEvent;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repositório responsável pelo histórico de ciclo de vida dos ativos.
 *
 * <p>NÃO contém regra de negócio.
 */
@Repository
public interface AssetLifecycleRepository extends JpaRepository<AssetLifecycleEvent, UUID> {

  /** Lista todos os eventos de um ativo, ordenados do mais antigo para o mais recente. */
  List<AssetLifecycleEvent> findAllByAssetIdOrderByOccurredAtAsc(UUID assetId);
}
