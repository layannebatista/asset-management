package com.portfolio.assetmanagement.domain.maintenance.enums;

/**
 * Define o ciclo de vida completo de um registro de manutenção.
 *
 * <p>Este enum controla os estados válidos e as transições permitidas para um MaintenanceRecord,
 * garantindo consistência com o AssetStatus e integridade sistêmica.
 */
public enum MaintenanceStatus {

  /**
   * Manutenção solicitada, aguardando início.
   *
   * <p>Estado inicial após criação.
   */
  REQUESTED,

  /**
   * Manutenção em andamento.
   *
   * <p>Durante este estado, o Asset deve estar com status IN_MAINTENANCE.
   */
  IN_PROGRESS,

  /**
   * Manutenção concluída com sucesso.
   *
   * <p>Estado final.
   */
  COMPLETED,

  /**
   * Manutenção cancelada antes da conclusão.
   *
   * <p>Estado final.
   */
  CANCELLED
}
