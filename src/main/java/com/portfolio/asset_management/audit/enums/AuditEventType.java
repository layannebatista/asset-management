package com.portfolio.asset_management.audit.enums;

/**
 * Define os tipos de eventos que podem ser registrados na auditoria do sistema.
 *
 * <p>Este enum representa ações relevantes de negócio que devem ser rastreáveis e auditáveis.
 */
public enum AuditEventType {

  // ORGANIZATION
  ORGANIZATION_CREATED,
  ORGANIZATION_STATUS_CHANGED,

  // UNIT
  UNIT_CREATED,
  UNIT_STATUS_CHANGED,

  // USER
  USER_CREATED,
  USER_STATUS_CHANGED,
  USER_LGPD_ACCEPTED,

  // ASSET
  ASSET_CREATED,
  ASSET_ASSIGNED,
  ASSET_UNASSIGNED,
  ASSET_TRANSFERRED,
  ASSET_STATUS_CHANGED,
  ASSET_RETIRED
}
