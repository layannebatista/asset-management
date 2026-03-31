package com.portfolio.assetmanagement.infrastructure.persistence.dashboard.repository;

import com.portfolio.assetmanagement.application.dashboard.dto.AssetIdleItemDTO;
import com.portfolio.assetmanagement.application.dashboard.dto.PersonalAssetDTO;
import com.portfolio.assetmanagement.application.dashboard.dto.PersonalMaintenanceDTO;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Repository;

@Repository
public class DashboardQueryRepository {

  @PersistenceContext private EntityManager entityManager;

  /* =====================================================
  =================== ADMIN (ORG) =====================
  ===================================================== */

  public Long countAssetsByOrganization(Long orgId) {
    return entityManager
        .createQuery("SELECT COUNT(a) FROM Asset a WHERE a.organization.id = :orgId", Long.class)
        .setParameter("orgId", orgId)
        .getSingleResult();
  }

  public List<Object[]> countAssetsByStatus(Long orgId) {
    return entityManager
        .createQuery(
            "SELECT a.status, COUNT(a) FROM Asset a WHERE a.organization.id = :orgId GROUP BY a.status",
            Object[].class)
        .setParameter("orgId", orgId)
        .getResultList();
  }

  public List<Object[]> countAssetsByUnit(Long orgId) {
    return entityManager
        .createQuery(
            "SELECT a.unit.id, COUNT(a) FROM Asset a WHERE a.organization.id = :orgId GROUP BY a.unit.id",
            Object[].class)
        .setParameter("orgId", orgId)
        .getResultList();
  }

  public List<Object[]> countAssetsByType(Long orgId) {
    return entityManager
        .createQuery(
            "SELECT a.type, COUNT(a) FROM Asset a WHERE a.organization.id = :orgId GROUP BY a.type",
            Object[].class)
        .setParameter("orgId", orgId)
        .getResultList();
  }

  public Long countMaintenanceByOrganization(Long orgId) {
    return entityManager
        .createQuery(
            "SELECT COUNT(m) FROM MaintenanceRecord m WHERE m.organizationId = :orgId AND m.status IN ('REQUESTED','IN_PROGRESS')",
            Long.class)
        .setParameter("orgId", orgId)
        .getSingleResult();
  }

  public List<Object[]> countMaintenanceByStatus(Long orgId) {
    return entityManager
        .createQuery(
            "SELECT m.status, COUNT(m) FROM MaintenanceRecord m WHERE m.organizationId = :orgId GROUP BY m.status",
            Object[].class)
        .setParameter("orgId", orgId)
        .getResultList();
  }

  public List<Object[]> countMaintenanceByMonth(Long orgId) {
    return entityManager
        .createQuery(
            "SELECT EXTRACT(YEAR FROM m.createdAt), EXTRACT(MONTH FROM m.createdAt), COUNT(m) FROM MaintenanceRecord m WHERE m.organizationId = :orgId GROUP BY EXTRACT(YEAR FROM m.createdAt), EXTRACT(MONTH FROM m.createdAt) ORDER BY EXTRACT(YEAR FROM m.createdAt), EXTRACT(MONTH FROM m.createdAt)",
            Object[].class)
        .setParameter("orgId", orgId)
        .getResultList();
  }

  public List<Object[]> countTransferByStatus(Long orgId) {
    return entityManager
        .createQuery(
            "SELECT t.status, COUNT(t) FROM TransferRequest t WHERE t.asset.organization.id = :orgId GROUP BY t.status",
            Object[].class)
        .setParameter("orgId", orgId)
        .getResultList();
  }

  public List<Object[]> countTransferByMonth(Long orgId) {
    return entityManager
        .createQuery(
            "SELECT EXTRACT(YEAR FROM t.requestedAt), EXTRACT(MONTH FROM t.requestedAt), COUNT(t) FROM TransferRequest t WHERE t.asset.organization.id = :orgId GROUP BY EXTRACT(YEAR FROM t.requestedAt), EXTRACT(MONTH FROM t.requestedAt) ORDER BY EXTRACT(YEAR FROM t.requestedAt), EXTRACT(MONTH FROM t.requestedAt)",
            Object[].class)
        .setParameter("orgId", orgId)
        .getResultList();
  }

  public List<Object[]> countUsersByStatus(Long orgId) {
    return entityManager
        .createQuery(
            "SELECT u.status, COUNT(u) FROM User u WHERE u.organization.id = :orgId GROUP BY u.status",
            Object[].class)
        .setParameter("orgId", orgId)
        .getResultList();
  }

  public List<Object[]> countUsersByRole(Long orgId) {
    return entityManager
        .createQuery(
            "SELECT u.role, COUNT(u) FROM User u WHERE u.organization.id = :orgId GROUP BY u.role",
            Object[].class)
        .setParameter("orgId", orgId)
        .getResultList();
  }

  public Long countUsersByOrganization(Long orgId) {
    return entityManager
        .createQuery("SELECT COUNT(u) FROM User u WHERE u.organization.id = :orgId", Long.class)
        .setParameter("orgId", orgId)
        .getSingleResult();
  }

  // --- Novos campos Admin ---

  public Long countAssetsAvailableByOrg(Long orgId) {
    return entityManager
        .createQuery(
            "SELECT COUNT(a) FROM Asset a WHERE a.organization.id = :orgId AND a.status = 'AVAILABLE'",
            Long.class)
        .setParameter("orgId", orgId)
        .getSingleResult();
  }

  public Long countAssetsRetiredThisMonth(Long orgId) {
    OffsetDateTime startOfMonth =
        LocalDate.now().withDayOfMonth(1).atStartOfDay().atOffset(ZoneOffset.UTC);
    return entityManager
        .createQuery(
            """
        SELECT COUNT(DISTINCT h.assetId)
        FROM AssetStatusHistory h
        JOIN Asset a ON a.id = h.assetId
        WHERE a.organization.id = :orgId
          AND h.newStatus = com.portfolio.assetmanagement.domain.asset.enums.AssetStatus.RETIRED
          AND h.changedAt >= :startOfMonth
        """,
            Long.class)
        .setParameter("orgId", orgId)
        .setParameter("startOfMonth", startOfMonth)
        .getSingleResult();
  }

  public Long countAssetsIdleByOrg(Long orgId) {
    OffsetDateTime threshold = OffsetDateTime.now().minusDays(30);
    return entityManager
        .createQuery(
            """
        SELECT COUNT(DISTINCT a.id)
        FROM Asset a
        WHERE a.organization.id = :orgId
          AND a.status = com.portfolio.assetmanagement.domain.asset.enums.AssetStatus.AVAILABLE
          AND NOT EXISTS (
            SELECT 1 FROM AssetStatusHistory h
            WHERE h.assetId = a.id AND h.changedAt > :threshold
          )
        """,
            Long.class)
        .setParameter("orgId", orgId)
        .setParameter("threshold", threshold)
        .getSingleResult();
  }

  public Long countPendingTransfersByOrg(Long orgId) {
    return entityManager
        .createQuery(
            "SELECT COUNT(t) FROM TransferRequest t WHERE t.asset.organization.id = :orgId AND t.status = 'PENDING'",
            Long.class)
        .setParameter("orgId", orgId)
        .getSingleResult();
  }

  public BigDecimal sumMaintenanceCostThisMonth(Long orgId) {
    OffsetDateTime startOfMonth =
        LocalDate.now().withDayOfMonth(1).atStartOfDay().atOffset(ZoneOffset.UTC);
    BigDecimal result =
        entityManager
            .createQuery(
                "SELECT COALESCE(SUM(m.actualCost), 0) FROM MaintenanceRecord m WHERE m.organizationId = :orgId AND m.status = 'COMPLETED' AND m.completedAt >= :startOfMonth",
                BigDecimal.class)
            .setParameter("orgId", orgId)
            .setParameter("startOfMonth", startOfMonth)
            .getSingleResult();
    return result != null ? result : BigDecimal.ZERO;
  }

  public Long countInsuranceExpiringSoon(Long orgId) {
    LocalDate today = LocalDate.now();
    LocalDate threshold = today.plusDays(30);
    return entityManager
        .createQuery(
            "SELECT COUNT(i) FROM AssetInsurance i WHERE i.organizationId = :orgId AND i.active = true AND i.expiryDate BETWEEN :today AND :threshold",
            Long.class)
        .setParameter("orgId", orgId)
        .setParameter("today", today)
        .setParameter("threshold", threshold)
        .getSingleResult();
  }

  /* =====================================================
  =================== MANAGER (UNIT) ==================
  ===================================================== */

  public Long countAssetsByUnitScope(Long unitId) {
    return entityManager
        .createQuery("SELECT COUNT(a) FROM Asset a WHERE a.unit.id = :unitId", Long.class)
        .setParameter("unitId", unitId)
        .getSingleResult();
  }

  public List<Object[]> countAssetsByStatusUnit(Long unitId) {
    return entityManager
        .createQuery(
            "SELECT a.status, COUNT(a) FROM Asset a WHERE a.unit.id = :unitId GROUP BY a.status",
            Object[].class)
        .setParameter("unitId", unitId)
        .getResultList();
  }

  public Long countMaintenanceByUnit(Long unitId) {
    return entityManager
        .createQuery(
            "SELECT COUNT(m) FROM MaintenanceRecord m WHERE m.unitId = :unitId AND m.status IN ('REQUESTED','IN_PROGRESS')",
            Long.class)
        .setParameter("unitId", unitId)
        .getSingleResult();
  }

  public List<Object[]> countMaintenanceByStatusUnit(Long unitId) {
    return entityManager
        .createQuery(
            "SELECT m.status, COUNT(m) FROM MaintenanceRecord m WHERE m.unitId = :unitId GROUP BY m.status",
            Object[].class)
        .setParameter("unitId", unitId)
        .getResultList();
  }

  public Long countUsersByUnit(Long unitId) {
    return entityManager
        .createQuery("SELECT COUNT(u) FROM User u WHERE u.unit.id = :unitId", Long.class)
        .setParameter("unitId", unitId)
        .getSingleResult();
  }

  // --- Novos campos Manager ---

  public Long countAssetsAvailableByUnit(Long unitId) {
    return entityManager
        .createQuery(
            "SELECT COUNT(a) FROM Asset a WHERE a.unit.id = :unitId AND a.status = 'AVAILABLE'",
            Long.class)
        .setParameter("unitId", unitId)
        .getSingleResult();
  }

  public Long countPendingTransfersByUnit(Long unitId) {
    return entityManager
        .createQuery(
            "SELECT COUNT(t) FROM TransferRequest t WHERE t.status = 'PENDING' AND (t.fromUnit.id = :unitId OR t.toUnit.id = :unitId)",
            Long.class)
        .setParameter("unitId", unitId)
        .getSingleResult();
  }

  public BigDecimal sumMaintenanceCostThisMonthByUnit(Long unitId) {
    OffsetDateTime startOfMonth =
        LocalDate.now().withDayOfMonth(1).atStartOfDay().atOffset(ZoneOffset.UTC);
    BigDecimal result =
        entityManager
            .createQuery(
                "SELECT COALESCE(SUM(m.actualCost), 0) FROM MaintenanceRecord m WHERE m.unitId = :unitId AND m.status = 'COMPLETED' AND m.completedAt >= :startOfMonth",
                BigDecimal.class)
            .setParameter("unitId", unitId)
            .setParameter("startOfMonth", startOfMonth)
            .getSingleResult();
    return result != null ? result : BigDecimal.ZERO;
  }

  /** Top 5 ativos disponíveis há mais tempo na unidade. */
  public List<AssetIdleItemDTO> findIdleAssetsByUnit(Long unitId) {
    // Busca a data da última mudança de status para cada ativo disponível da unidade
    List<Object[]> rows =
        entityManager
            .createQuery(
                """
        SELECT a.assetTag, a.model, a.type,
               (SELECT MAX(h.changedAt) FROM AssetStatusHistory h WHERE h.assetId = a.id)
        FROM Asset a
        WHERE a.unit.id = :unitId
          AND a.status = com.portfolio.assetmanagement.domain.asset.enums.AssetStatus.AVAILABLE
        ORDER BY
          (SELECT MAX(h.changedAt) FROM AssetStatusHistory h WHERE h.assetId = a.id) ASC NULLS FIRST
        """,
                Object[].class)
            .setParameter("unitId", unitId)
            .setMaxResults(5)
            .getResultList();

    List<AssetIdleItemDTO> result = new ArrayList<>();
    OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
    for (Object[] row : rows) {
      String tag = (String) row[0];
      String model = (String) row[1];
      String type = row[2].toString();
      OffsetDateTime lastChanged = (OffsetDateTime) row[3];
      long days = lastChanged != null ? java.time.Duration.between(lastChanged, now).toDays() : 0;
      result.add(new AssetIdleItemDTO(tag, model, type, days));
    }
    return result;
  }

  /* =====================================================
  =================== OPERATOR (USER) =================
  ===================================================== */

  public Long countAssetsByUser(Long userId) {
    return entityManager
        .createQuery("SELECT COUNT(a) FROM Asset a WHERE a.assignedUser.id = :userId", Long.class)
        .setParameter("userId", userId)
        .getSingleResult();
  }

  public Long countMaintenanceByUser(Long userId) {
    return entityManager
        .createQuery(
            "SELECT COUNT(m) FROM MaintenanceRecord m WHERE m.requestedByUserId = :userId AND m.status IN ('REQUESTED','IN_PROGRESS')",
            Long.class)
        .setParameter("userId", userId)
        .getSingleResult();
  }

  public Long countPendingTransfersByUser(Long userId) {
    return entityManager
        .createQuery(
            "SELECT COUNT(t) FROM TransferRequest t WHERE t.asset.assignedUser.id = :userId AND t.status IN ('PENDING','APPROVED')",
            Long.class)
        .setParameter("userId", userId)
        .getSingleResult();
  }

  /** Lista ativos do usuário com status e data da última mudança de status (atribuição). */
  public List<PersonalAssetDTO> findAssetsByUser(Long userId) {
    List<Object[]> rows =
        entityManager
            .createQuery(
                """
        SELECT a.assetTag, a.model, a.type, a.status,
               (SELECT MAX(h.changedAt) FROM AssetStatusHistory h
                WHERE h.assetId = a.id
                  AND h.newStatus = com.portfolio.assetmanagement.domain.asset.enums.AssetStatus.ASSIGNED)
        FROM Asset a
        WHERE a.assignedUser.id = :userId
        ORDER BY a.id DESC
        """,
                Object[].class)
            .setParameter("userId", userId)
            .getResultList();

    List<PersonalAssetDTO> result = new ArrayList<>();
    for (Object[] row : rows) {
      PersonalAssetDTO dto = new PersonalAssetDTO();
      dto.setAssetTag((String) row[0]);
      dto.setModel((String) row[1]);
      dto.setType(row[2].toString());
      dto.setStatus(row[3].toString());
      if (row[4] != null) dto.setAssignedSince(row[4].toString().substring(0, 10));
      result.add(dto);
    }
    return result;
  }

  /** Manutenções abertas solicitadas pelo usuário (top 3). */
  public List<PersonalMaintenanceDTO> findOpenMaintenancesByUser(Long userId) {
    List<Object[]> rows =
        entityManager
            .createQuery(
                "SELECT m.id, m.asset.assetTag, m.status, m.createdAt FROM MaintenanceRecord m WHERE m.requestedByUserId = :userId AND m.status IN ('REQUESTED','IN_PROGRESS') ORDER BY m.createdAt DESC",
                Object[].class)
            .setParameter("userId", userId)
            .setMaxResults(3)
            .getResultList();

    List<PersonalMaintenanceDTO> result = new ArrayList<>();
    for (Object[] row : rows) {
      PersonalMaintenanceDTO dto = new PersonalMaintenanceDTO();
      dto.setCode(String.format("MNT-%04d", ((Number) row[0]).longValue()));
      dto.setAssetTag((String) row[1]);
      dto.setStatus(row[2].toString());
      dto.setCreatedAt(row[3].toString());
      result.add(dto);
    }
    return result;
  }

  /** Conta ativos de uma unidade por status específico (usado para calcular utilizationRate). */
  public Long countAssetsByStatusAndUnit(Long unitId, String status) {
    com.portfolio.assetmanagement.domain.asset.enums.AssetStatus enumStatus =
        com.portfolio.assetmanagement.domain.asset.enums.AssetStatus.valueOf(status);
    return entityManager
        .createQuery(
            "SELECT COUNT(a) FROM Asset a WHERE a.unit.id = :unitId AND a.status = :status",
            Long.class)
        .setParameter("unitId", unitId)
        .setParameter("status", enumStatus)
        .getSingleResult();
  }
}
