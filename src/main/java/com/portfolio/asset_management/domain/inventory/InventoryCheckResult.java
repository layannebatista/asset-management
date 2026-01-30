package com.portfolio.asset_management.domain.inventory;

/**
 * Resultado de uma verificação de inventário.
 *
 * <p>Representa o resultado técnico da checagem física de um ativo dentro de um ciclo de
 * inventário.
 *
 * <p>Não governa processo nem altera ativo diretamente.
 */
public enum InventoryCheckResult {

  /** Ativo foi localizado fisicamente. */
  LOCALIZADO,

  /** Ativo NÃO foi localizado durante o inventário. */
  NAO_LOCALIZADO;

  /** Indica se o ativo foi localizado. */
  public boolean isLocalizado() {
    return this == LOCALIZADO;
  }

  /** Indica se o ativo não foi localizado. */
  public boolean isNaoLocalizado() {
    return this == NAO_LOCALIZADO;
  }
}
