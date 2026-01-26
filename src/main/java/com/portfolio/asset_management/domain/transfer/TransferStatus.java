package com.portfolio.asset_management.domain.transfer;

/**
 * Representa o estado de uma solicitação de transferência.
 *
 * Estados possíveis:
 * - PENDENTE: aguardando decisão
 * - APROVADA: aprovada e pronta para execução
 * - REJEITADA: recusada
 * - CANCELADA: cancelada pelo solicitante
 */
public enum TransferStatus {

    PENDENTE,

    APROVADA,

    REJEITADA,

    CANCELADA
}
