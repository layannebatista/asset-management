package com.portfolio.asset_management.domain.transfer;

/**
 * Representa a decisão tomada durante a aprovação de uma TransferRequest.
 *
 * <p>Este enum NÃO representa o status do processo, apenas o resultado da decisão.
 */
public enum TransferApprovalDecision {
  APROVADA,
  REJEITADA
}
