package com.portfolio.assetmanagement.domain.audit.enums;

public enum AuditEventType {

  // ========================
  // ORGANIZATION
  // ========================

  ORGANIZATION_CREATED,
  ORGANIZATION_STATUS_CHANGED,
  ORGANIZATION_UPDATED,
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
  ASSET_UPDATED,

  // ========================
  // MAINTENANCE
  // ========================

  MAINTENANCE_OPENED,
  MAINTENANCE_STARTED,
  MAINTENANCE_COMPLETED,
  MAINTENANCE_CANCELLED,

  // ========================
  // TRANSFER
  // ========================

  TRANSFER_REQUESTED,
  TRANSFER_APPROVED,
  TRANSFER_REJECTED,
  TRANSFER_COMPLETED
}