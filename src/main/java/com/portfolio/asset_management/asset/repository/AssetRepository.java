package com.portfolio.asset_management.asset.repository;

import com.portfolio.asset_management.asset.entity.Asset;
import com.portfolio.asset_management.organization.entity.Organization;
import com.portfolio.asset_management.unit.entity.Unit;
import com.portfolio.asset_management.user.entity.User;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repositório responsável pelo acesso a dados da entidade Asset.
 *
 * <p>Centraliza operações de persistência e consulta relacionadas aos ativos do sistema.
 */
@Repository
public interface AssetRepository extends JpaRepository<Asset, Long> {

  Optional<Asset> findByAssetTag(String assetTag);

  List<Asset> findByOrganization(Organization organization);

  List<Asset> findByUnit(Unit unit);

  List<Asset> findByAssignedUser(User user);
}
