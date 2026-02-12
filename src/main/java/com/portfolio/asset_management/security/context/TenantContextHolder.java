package com.portfolio.asset_management.security.context;

/**
 * Holder ThreadLocal do tenant atual.
 *
 * <p>Garante isolamento por request.
 */
public final class TenantContextHolder {

  private static final ThreadLocal<TenantContext> CONTEXT = new ThreadLocal<>();

  private TenantContextHolder() {}

  public static void setTenant(Long organizationId) {

    CONTEXT.set(new TenantContext(organizationId));
  }

  public static TenantContext getTenant() {

    return CONTEXT.get();
  }

  public static Long getOrganizationId() {

    TenantContext context = CONTEXT.get();

    return context != null ? context.getOrganizationId() : null;
  }

  public static void clear() {

    CONTEXT.remove();
  }
}
