package com.portfolio.asset_management.asset.enums;

/**
 * Define os possíveis status de um ativo no sistema.
 *
 * <p>O status do ativo controla seu ciclo de vida, visibilidade e permissões de operação (uso,
 * transferência, manutenção).
 */
public enum AssetStatus {

  /** Ativo cadastrado, disponível e sem vínculo com usuário. */
  AVAILABLE,

  /** Ativo vinculado a um usuário. */
  ASSIGNED,

  /** Ativo em processo de transferência entre unidades ou usuários. */
  IN_TRANSFER,

  /** Ativo em manutenção. */
  IN_MAINTENANCE,

  /** Ativo temporariamente indisponível para uso. */
  UNAVAILABLE,

  /** Ativo baixado/desativado definitivamente. */
  RETIRED
}
