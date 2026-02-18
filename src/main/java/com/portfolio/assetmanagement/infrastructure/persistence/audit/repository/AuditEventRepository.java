package com.portfolio.assetmanagement.infrastructure.persistence.audit.repository;

import com.portfolio.assetmanagement.domain.audit.entity.AuditEvent;
import com.portfolio.assetmanagement.domain.audit.enums.AuditEventType;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repositório responsável pelo acesso a eventos de auditoria.
 *
 * <p>Garantias enterprise:
 *
 * <p>- queries performáticas - suporte a investigação - suporte a compliance - suporte a
 * observabilidade
 */
@Repository
public interface AuditEventRepository extends JpaRepository<AuditEvent, Long> {

  /** Lista eventos por organização. */
  List<AuditEvent> findByOrganizationIdOrderByCreatedAtDesc(Long organizationId);

  /** Lista eventos por usuário. */
  List<AuditEvent> findByActorUserIdOrderByCreatedAtDesc(Long actorUserId);

  /** Lista eventos por alvo. */
  List<AuditEvent> findByTargetTypeAndTargetIdOrderByCreatedAtDesc(
      String targetType, Long targetId);

  /** Lista eventos por tipo. */
  List<AuditEvent> findByTypeOrderByCreatedAtDesc(AuditEventType type);

  /** Lista eventos por período. */
  List<AuditEvent> findByOrganizationIdAndCreatedAtBetweenOrderByCreatedAtDesc(
      Long organizationId, OffsetDateTime start, OffsetDateTime end);

  /** Lista eventos por unidade. */
  List<AuditEvent> findByUnitIdOrderByCreatedAtDesc(Long unitId);

  /** Lista eventos por targetId. */
  List<AuditEvent> findByTargetIdOrderByCreatedAtDesc(Long targetId);

  /** Busca evento mais recente de um target. */
  Optional<AuditEvent> findFirstByTargetTypeAndTargetIdOrderByCreatedAtDesc(
      String targetType, Long targetId);

  /** Verifica existência de eventos para target. */
  boolean existsByTargetTypeAndTargetId(String targetType, Long targetId);

  /** Lista eventos por organização e tipo. */
  List<AuditEvent> findByOrganizationIdAndTypeOrderByCreatedAtDesc(
      Long organizationId, AuditEventType type);

  /** Lista eventos por organização e usuário. */
  List<AuditEvent> findByOrganizationIdAndActorUserIdOrderByCreatedAtDesc(
      Long organizationId, Long actorUserId);
}