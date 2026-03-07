package com.portfolio.assetmanagement.infrastructure.persistence.insurance.repository;

import com.portfolio.assetmanagement.domain.insurance.entity.AssetInsurance;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface InsuranceRepository extends JpaRepository<AssetInsurance, Long> {

  /** Apólice ativa do ativo (máximo 1). */
  Optional<AssetInsurance> findByAssetIdAndActiveTrue(Long assetId);

  /** Todas as apólices de um ativo (histórico). */
  List<AssetInsurance> findByAssetIdOrderByCreatedAtDesc(Long assetId);

  /** Apólices vencendo nos próximos N dias (para alertas). */
  @Query(
      """
      SELECT i FROM AssetInsurance i
      WHERE i.organizationId = :orgId
        AND i.active = true
        AND i.expiryDate BETWEEN :today AND :threshold
      ORDER BY i.expiryDate ASC
      """)
  List<AssetInsurance> findExpiringSoon(
      @Param("orgId") Long organizationId,
      @Param("today") LocalDate today,
      @Param("threshold") LocalDate threshold);

  /** Apólices vencidas e ainda marcadas como ativas (inconsistência). */
  @Query(
      """
      SELECT i FROM AssetInsurance i
      WHERE i.organizationId = :orgId
        AND i.active = true
        AND i.expiryDate < :today
      """)
  List<AssetInsurance> findExpiredButActive(
      @Param("orgId") Long organizationId, @Param("today") LocalDate today);
}
