package com.portfolio.asset_management.audit.repository;

import com.portfolio.asset_management.audit.entity.AuditEvent;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repositório responsável pelo acesso aos dados de auditoria.
 *
 * <p>Utilizado para persistir e consultar eventos auditáveis do sistema.
 */
public interface AuditEventRepository extends JpaRepository<AuditEvent, Long> {

  List<AuditEvent> findByOrganizationId(Long organizationId);

  List<AuditEvent> findByOrganizationIdAndUnitId(Long organizationId, Long unitId);

  List<AuditEvent> findByType(String type);
}
