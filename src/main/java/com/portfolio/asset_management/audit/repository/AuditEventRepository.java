package com.portfolio.asset_management.audit.repository;

import com.portfolio.asset_management.audit.entity.AuditEvent;
import com.portfolio.asset_management.audit.enums.AuditEventType;
import java.time.OffsetDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AuditEventRepository extends JpaRepository<AuditEvent, Long> {

  List<AuditEvent> findByOrganizationIdOrderByCreatedAtDesc(Long organizationId);

  List<AuditEvent> findByActorUserIdOrderByCreatedAtDesc(Long actorUserId);

  List<AuditEvent> findByTargetTypeAndTargetIdOrderByCreatedAtDesc(
      String targetType, Long targetId);

  List<AuditEvent> findByTypeOrderByCreatedAtDesc(AuditEventType type);

  List<AuditEvent> findByOrganizationIdAndCreatedAtBetweenOrderByCreatedAtDesc(
      Long organizationId, OffsetDateTime start, OffsetDateTime end);
}
