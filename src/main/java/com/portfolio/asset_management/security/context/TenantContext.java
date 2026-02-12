package com.portfolio.asset_management.security.context;

/**
 * Representa o tenant atual (Organization).
 *
 * <p>Imutável e seguro.
 */
public class TenantContext {

  private final Long organizationId;

  public TenantContext(Long organizationId) {

    if (organizationId == null) {
      throw new IllegalArgumentException("organizationId não pode ser null");
    }

    this.organizationId = organizationId;
  }

  public Long getOrganizationId() {
    return organizationId;
  }
}
