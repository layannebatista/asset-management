package com.portfolio.asset_management.audit.enums;

/**
 * Define os tipos de eventos que podem ser registrados na auditoria do sistema.
 *
 * <p>Mantém compatibilidade com eventos existentes e adiciona eventos específicos para automação
 * enterprise.
 */
public enum AuditEventType {

  // ========================
  // ORGANIZATION
  // ========================

  ORGANIZATION_CREATED,
  ORGANIZATION_STATUS_CHANGED,
  ORGANIZATION_UPDATED,

  // NOVOS EVENTOS ESPECÍFICOS (SEM REMOVER OS EXISTENTES)
  ORGANIZATION_ACTIVATED,
  ORGANIZATION_INACTIVATED,

  // ========================
  // UNIT
  // ========================

  UNIT_CREATED,
  UNIT_STATUS_CHANGED,
  UNIT_UPDATED,

  UNIT_ACTIVATED,
  UNIT_INACTIVATED,

  // ========================
  // USER
  // ========================

  USER_CREATED,
  USER_STATUS_CHANGED,
  USER_LGPD_ACCEPTED,
  USER_UPDATED,

  USER_ACTIVATED,
  USER_INACTIVATED,

  // ========================
  // ASSET
  // ========================

  ASSET_CREATED,
  ASSET_ASSIGNED,
  ASSET_UNASSIGNED,
  ASSET_TRANSFERRED,
  ASSET_STATUS_CHANGED,
  ASSET_RETIRED,

  ASSET_UPDATED
}
