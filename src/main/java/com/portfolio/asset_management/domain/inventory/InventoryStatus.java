package com.portfolio.asset_management.domain.inventory;

/**
 * Status do ciclo de Inventário.
 *
 * <p>Representa o estado do PROCESSO de inventário, e não o estado de ativos ou itens individuais.
 *
 * <p>Fluxo válido: ABERTO -> FECHADO
 */
public enum InventoryStatus {

  /** Ciclo de inventário em andamento. Permite adicionar itens e registrar checks. */
  ABERTO,

  /** Ciclo de inventário encerrado. Estado final e imutável. */
  FECHADO;

  /** Indica se o ciclo está encerrado. */
  public boolean isFinal() {
    return this == FECHADO;
  }
}
