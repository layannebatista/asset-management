package com.portfolio.assetmanagement.infrastructure.persistence.audit.repository;

import com.portfolio.assetmanagement.domain.audit.entity.AuditEvent;
import com.portfolio.assetmanagement.domain.audit.enums.AuditEventType;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AuditRepository extends JpaRepository<AuditEvent, Long> {

  List<AuditEvent> findByOrganizationIdOrderByCreatedAtDesc(Long organizationId);

  List<AuditEvent> findByTargetIdOrderByCreatedAtDesc(Long targetId);

  List<AuditEvent> findByActorUserIdOrderByCreatedAtDesc(Long actorUserId);

  List<AuditEvent> findByTypeOrderByCreatedAtDesc(AuditEventType type);
}
