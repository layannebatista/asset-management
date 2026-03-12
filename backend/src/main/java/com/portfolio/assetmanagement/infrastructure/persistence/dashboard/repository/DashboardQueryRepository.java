package com.portfolio.assetmanagement.infrastructure.persistence.dashboard.repository;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.util.List;
import org.springframework.stereotype.Repository;

@Repository
public class DashboardQueryRepository {

  @PersistenceContext private EntityManager entityManager;

  /* =====================================================
  =================== ADMIN (ORG) =====================
  ===================================================== */

  public Long countAssetsByOrganization(Long organizationId) {

    String jpql =
        """
        SELECT COUNT(a)
        FROM Asset a
        WHERE a.organization.id = :organizationId
        """;

    return entityManager
        .createQuery(jpql, Long.class)
        .setParameter("organizationId", organizationId)
        .getSingleResult();
  }

  public List<Object[]> countAssetsByStatus(Long organizationId) {

    String jpql =
        """
        SELECT a.status, COUNT(a)
        FROM Asset a
        WHERE a.organization.id = :organizationId
        GROUP BY a.status
        """;

    return entityManager
        .createQuery(jpql, Object[].class)
        .setParameter("organizationId", organizationId)
        .getResultList();
  }

  public List<Object[]> countAssetsByUnit(Long organizationId) {

    String jpql =
        """
        SELECT a.unit.id, COUNT(a)
        FROM Asset a
        WHERE a.organization.id = :organizationId
        GROUP BY a.unit.id
        """;

    return entityManager
        .createQuery(jpql, Object[].class)
        .setParameter("organizationId", organizationId)
        .getResultList();
  }

  public List<Object[]> countAssetsByType(Long organizationId) {

    String jpql =
        """
        SELECT a.type, COUNT(a)
        FROM Asset a
        WHERE a.organization.id = :organizationId
        GROUP BY a.type
        """;

    return entityManager
        .createQuery(jpql, Object[].class)
        .setParameter("organizationId", organizationId)
        .getResultList();
  }

  public Long countMaintenanceByOrganization(Long organizationId) {

    String jpql =
        """
        SELECT COUNT(m)
        FROM MaintenanceRecord m
        WHERE m.organizationId = :organizationId
        """;

    return entityManager
        .createQuery(jpql, Long.class)
        .setParameter("organizationId", organizationId)
        .getSingleResult();
  }

  public List<Object[]> countMaintenanceByStatus(Long organizationId) {

    String jpql =
        """
        SELECT m.status, COUNT(m)
        FROM MaintenanceRecord m
        WHERE m.organizationId = :organizationId
        GROUP BY m.status
        """;

    return entityManager
        .createQuery(jpql, Object[].class)
        .setParameter("organizationId", organizationId)
        .getResultList();
  }

  public List<Object[]> countMaintenanceByMonth(Long organizationId) {

    String jpql =
        """
        SELECT EXTRACT(YEAR FROM m.createdAt),
               EXTRACT(MONTH FROM m.createdAt),
               COUNT(m)
        FROM MaintenanceRecord m
        WHERE m.organizationId = :organizationId
        GROUP BY EXTRACT(YEAR FROM m.createdAt),
                 EXTRACT(MONTH FROM m.createdAt)
        ORDER BY EXTRACT(YEAR FROM m.createdAt),
                 EXTRACT(MONTH FROM m.createdAt)
        """;

    return entityManager
        .createQuery(jpql, Object[].class)
        .setParameter("organizationId", organizationId)
        .getResultList();
  }

  public List<Object[]> countTransferByStatus(Long organizationId) {

    String jpql =
        """
        SELECT t.status, COUNT(t)
        FROM TransferRequest t
        WHERE t.asset.organization.id = :organizationId
        GROUP BY t.status
        """;

    return entityManager
        .createQuery(jpql, Object[].class)
        .setParameter("organizationId", organizationId)
        .getResultList();
  }

  /**
   * Conta transferências agrupadas por mês/ano.
   *
   * <p>Corrigido: método ausente que causava dashboard executivo sempre retornar transferByMonth
   * vazio, independente dos dados reais.
   */
  public List<Object[]> countTransferByMonth(Long organizationId) {

    String jpql =
        """
        SELECT EXTRACT(YEAR FROM t.requestedAt),
               EXTRACT(MONTH FROM t.requestedAt),
               COUNT(t)
        FROM TransferRequest t
        WHERE t.asset.organization.id = :organizationId
        GROUP BY EXTRACT(YEAR FROM t.requestedAt),
                 EXTRACT(MONTH FROM t.requestedAt)
        ORDER BY EXTRACT(YEAR FROM t.requestedAt),
                 EXTRACT(MONTH FROM t.requestedAt)
        """;

    return entityManager
        .createQuery(jpql, Object[].class)
        .setParameter("organizationId", organizationId)
        .getResultList();
  }

  public List<Object[]> countUsersByStatus(Long organizationId) {

    String jpql =
        """
        SELECT u.status, COUNT(u)
        FROM User u
        WHERE u.organization.id = :organizationId
        GROUP BY u.status
        """;

    return entityManager
        .createQuery(jpql, Object[].class)
        .setParameter("organizationId", organizationId)
        .getResultList();
  }

  /**
   * Conta usuários agrupados por role.
   *
   * <p>Corrigido: método ausente que causava dashboard executivo sempre retornar usersByRole vazio,
   * independente dos dados reais.
   */
  public List<Object[]> countUsersByRole(Long organizationId) {

    String jpql =
        """
        SELECT u.role, COUNT(u)
        FROM User u
        WHERE u.organization.id = :organizationId
        GROUP BY u.role
        """;

    return entityManager
        .createQuery(jpql, Object[].class)
        .setParameter("organizationId", organizationId)
        .getResultList();
  }

  /* =====================================================
  =================== MANAGER (UNIT) ==================
  ===================================================== */

  public Long countAssetsByUnitScope(Long unitId) {

    String jpql =
        """
        SELECT COUNT(a)
        FROM Asset a
        WHERE a.unit.id = :unitId
        """;

    return entityManager
        .createQuery(jpql, Long.class)
        .setParameter("unitId", unitId)
        .getSingleResult();
  }

  public List<Object[]> countAssetsByStatusUnit(Long unitId) {

    String jpql =
        """
        SELECT a.status, COUNT(a)
        FROM Asset a
        WHERE a.unit.id = :unitId
        GROUP BY a.status
        """;

    return entityManager
        .createQuery(jpql, Object[].class)
        .setParameter("unitId", unitId)
        .getResultList();
  }

  public Long countMaintenanceByUnit(Long unitId) {

    String jpql =
        """
        SELECT COUNT(m)
        FROM MaintenanceRecord m
        WHERE m.unitId = :unitId
        """;

    return entityManager
        .createQuery(jpql, Long.class)
        .setParameter("unitId", unitId)
        .getSingleResult();
  }

  public List<Object[]> countMaintenanceByStatusUnit(Long unitId) {

    String jpql =
        """
        SELECT m.status, COUNT(m)
        FROM MaintenanceRecord m
        WHERE m.unitId = :unitId
        GROUP BY m.status
        """;

    return entityManager
        .createQuery(jpql, Object[].class)
        .setParameter("unitId", unitId)
        .getResultList();
  }

  public Long countUsersByUnit(Long unitId) {

    String jpql =
        """
        SELECT COUNT(u)
        FROM User u
        WHERE u.unit.id = :unitId
        """;

    return entityManager
        .createQuery(jpql, Long.class)
        .setParameter("unitId", unitId)
        .getSingleResult();
  }

  /* =====================================================
  =================== OPERATOR (USER) =================
  ===================================================== */

  public Long countAssetsByUser(Long userId) {

    String jpql =
        """
        SELECT COUNT(a)
        FROM Asset a
        WHERE a.assignedUser.id = :userId
        """;

    return entityManager
        .createQuery(jpql, Long.class)
        .setParameter("userId", userId)
        .getSingleResult();
  }

  public Long countMaintenanceByUser(Long userId) {

    String jpql =
        """
        SELECT COUNT(m)
        FROM MaintenanceRecord m
        WHERE m.requestedByUserId = :userId
           OR m.startedByUserId = :userId
           OR m.completedByUserId = :userId
        """;

    return entityManager
        .createQuery(jpql, Long.class)
        .setParameter("userId", userId)
        .getSingleResult();
  }

  public Long countUsersByOrganization(Long organizationId) {

    String jpql =
        """
        SELECT COUNT(u)
        FROM User u
        WHERE u.organization.id = :organizationId
        """;

    return entityManager
        .createQuery(jpql, Long.class)
        .setParameter("organizationId", organizationId)
        .getSingleResult();
  }
}