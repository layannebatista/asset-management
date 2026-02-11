package com.portfolio.asset_management.audit.repository;

import com.portfolio.asset_management.audit.entity.AuditEvent;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuditRepository extends JpaRepository<AuditEvent, Long> {

  List<AuditEvent> findByOrganizationIdOrderByCreatedAtDesc(Long organizationId);

  List<AuditEvent> findByTargetIdOrderByCreatedAtDesc(Long targetId);

  List<AuditEvent> findByUserIdOrderByCreatedAtDesc(Long userId);

  List<AuditEvent> findByEventTypeOrderByCreatedAtDesc(String eventType);
}
