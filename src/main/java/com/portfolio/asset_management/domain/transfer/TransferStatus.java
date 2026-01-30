package com.portfolio.asset_management.domain.transfer;

/**
 * Estados possíveis de uma Transferência.
 *
 * <p>Define a máquina de estados do processo de transferência. Não contém regra de negócio, apenas
 * semântica de estado.
 */
public enum TransferStatus {

  /** Transferência criada e aguardando aprovação. */
  SOLICITADA,

  /** Transferência aprovada e aguardando confirmação de recebimento. */
  APROVADA,

  /** Transferência rejeitada. */
  REJEITADA,

  /** Transferência concluída com sucesso. */
  CONCLUIDA,

  /** Transferência cancelada ou expirada. */
  CANCELADA
}
