package com.portfolio.asset_management.infrastructure.persistence;

import com.portfolio.asset_management.domain.asset.Asset;
import com.portfolio.asset_management.domain.asset.AssetStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repositório responsável exclusivamente
 * pela persistência de ativos.
 *
 * NÃO contém regra de negócio.
 */
@Repository
public interface AssetRepository extends JpaRepository<Asset, UUID> {

    /**
     * Busca um ativo pelo código único.
     */
    Optional<Asset> findByAssetCode(String assetCode);

    /**
     * Verifica se já existe um ativo com o código informado.
     */
    boolean existsByAssetCode(String assetCode);

    /**
     * Lista ativos por status.
     */
    List<Asset> findAllByStatus(AssetStatus status);
}
