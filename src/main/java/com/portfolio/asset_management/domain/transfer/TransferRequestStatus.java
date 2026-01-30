package com.portfolio.asset_management.domain.transfer;

/**
 * Estados possíveis do PROCESSO de Transferência de um Ativo.
 *
 * <p>Este enum representa exclusivamente o lifecycle da TransferRequest. Não deve ser reutilizado
 * por projeções, DTOs ou outros modelos.
 *
 * <p>Status do processo ≠ Status do ativo.
 */
public enum TransferRequestStatus {

  /** Solicitação criada, ainda não enviada para aprovação. */
  CRIADA(false),

  /** Solicitação em fluxo de aprovação. O ativo deve estar bloqueado para outras ações. */
  EM_APROVACAO(false),

  /** Solicitação aprovada formalmente. Aguardando execução da transferência. */
  APROVADA(false),

  /** Solicitação rejeitada. Estado final. */
  REJEITADA(true),

  /** Transferência executada com sucesso. Estado final. */
  EXECUTADA(true),

  /** Solicitação cancelada antes da execução. Estado final. */
  CANCELADA(true);

  private final boolean estadoFinal;

  TransferRequestStatus(boolean estadoFinal) {
    this.estadoFinal = estadoFinal;
  }

  /** Indica se o status é final e não permite novas ações. */
  public boolean isFinal() {
    return estadoFinal;
  }

  /** Indica se o processo ainda está ativo. */
  public boolean isAtivo() {
    return !estadoFinal;
  }
}
