package com.portfolio.asset_management.domain.maintenance;

/**
 * Estados possíveis do PROCESSO de Manutenção de um Ativo.
 *
 * <p>Este enum representa exclusivamente o lifecycle
 * da MaintenanceRequest.
 *
 * <p>Status do processo ≠ status do ativo.
 */
public enum MaintenanceRequestStatus {

  /**
   * Solicitação criada, ainda não iniciada.
   */
  CRIADA(false),

  /**
   * Manutenção em andamento.
   * O ativo deve estar fora de uso.
   */
  EM_MANUTENCAO(false),

  /**
   * Manutenção finalizada com sucesso.
   * Estado final.
   */
  FINALIZADA(true),

  /**
   * Solicitação cancelada.
   * Estado final.
   */
  CANCELADA(true);

  private final boolean estadoFinal;

  MaintenanceRequestStatus(boolean estadoFinal) {
    this.estadoFinal = estadoFinal;
  }

  /**
   * Indica se o status é final e não permite novas ações.
   */
  public boolean isFinal() {
    return estadoFinal;
  }

  /**
   * Indica se o processo ainda está ativo.
   */
  public boolean isAtivo() {
    return !estadoFinal;
  }
}
