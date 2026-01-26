package com.portfolio.asset_management.domain.inventory;

/**
 * Representa o estado real de um ciclo de inventário.
 *
 * <p>Estados refletem o ciclo de vida do inventário e NÃO representam status do ativo.
 */
public enum InventoryStatus {

  /** Ciclo de inventário em andamento. */
  ABERTO,

  /** Ciclo de inventário encerrado. */
  FECHADO,

  /** Ciclo de inventário cancelado. */
  CANCELADO
}
