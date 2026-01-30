package com.portfolio.asset_management.infrastructure.persistence;

import com.portfolio.asset_management.domain.asset.Asset;
import com.portfolio.asset_management.domain.asset.AssetStatus;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repositório de persistência do Asset.
 *
 * <p>Responsável apenas por acesso a dados. Nenhuma regra de negócio deve existir aqui.
 */
@Repository
public interface AssetRepository extends JpaRepository<Asset, UUID> {

  boolean existsByAssetCode(String assetCode);

  Optional<Asset> findByAssetCode(String assetCode);

  List<Asset> findAllByStatus(AssetStatus status);
}
