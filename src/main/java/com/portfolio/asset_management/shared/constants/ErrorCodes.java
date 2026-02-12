package com.portfolio.asset_management.shared.constants;

/**
 * Códigos padronizados de erro do sistema.
 *
 * <p>Estes códigos devem ser usados em todas as exceções.
 *
 * <p>Permite: - rastreabilidade - consistência - testes automatizados - auditoria - integração
 * frontend
 */
public final class ErrorCodes {

  /** ============================ ERROS GENÉRICOS ============================ */
  public static final String INTERNAL_ERROR = "INTERNAL_ERROR";

  public static final String VALIDATION_ERROR = "VALIDATION_ERROR";

  public static final String BUSINESS_RULE_VIOLATION = "BUSINESS_RULE_VIOLATION";

  public static final String RESOURCE_NOT_FOUND = "RESOURCE_NOT_FOUND";

  /** ============================ SEGURANÇA ============================ */
  public static final String UNAUTHORIZED = "UNAUTHORIZED";

  public static final String FORBIDDEN = "FORBIDDEN";

  public static final String INVALID_TOKEN = "INVALID_TOKEN";

  public static final String TOKEN_EXPIRED = "TOKEN_EXPIRED";

  public static final String ACCESS_DENIED = "ACCESS_DENIED";

  /** ============================ TENANT / ORGANIZATION ============================ */
  public static final String TENANT_ACCESS_DENIED = "TENANT_ACCESS_DENIED";

  public static final String ORGANIZATION_NOT_FOUND = "ORGANIZATION_NOT_FOUND";

  /** ============================ USER ============================ */
  public static final String USER_NOT_FOUND = "USER_NOT_FOUND";

  public static final String USER_INACTIVE = "USER_INACTIVE";

  public static final String USER_ALREADY_EXISTS = "USER_ALREADY_EXISTS";

  /** ============================ ASSET ============================ */
  public static final String ASSET_NOT_FOUND = "ASSET_NOT_FOUND";

  public static final String ASSET_ALREADY_EXISTS = "ASSET_ALREADY_EXISTS";

  public static final String ASSET_INVALID_STATE = "ASSET_INVALID_STATE";

  /** ============================ UNIT ============================ */
  public static final String UNIT_NOT_FOUND = "UNIT_NOT_FOUND";

  /** ============================ TRANSFER ============================ */
  public static final String TRANSFER_NOT_FOUND = "TRANSFER_NOT_FOUND";

  public static final String TRANSFER_INVALID_STATE = "TRANSFER_INVALID_STATE";

  /** ============================ INVENTORY ============================ */
  public static final String INVENTORY_NOT_FOUND = "INVENTORY_NOT_FOUND";

  /** ============================ MAINTENANCE ============================ */
  public static final String MAINTENANCE_NOT_FOUND = "MAINTENANCE_NOT_FOUND";

  private ErrorCodes() {
    // Prevent instantiation
  }
}
