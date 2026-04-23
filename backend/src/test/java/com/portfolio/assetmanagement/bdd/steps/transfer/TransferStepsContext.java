package com.portfolio.assetmanagement.bdd.steps.transfer;

/**
 * Context compartilhado entre os diferentes Steps de Transfer.
 * Mantém o estado (IDs de unidades, transferência) necessário ao longo do cenário.
 */
public class TransferStepsContext {

  private Long unidadeDestinoId;
  private Long transferId;

  public Long getUnidadeDestinoId() {
    return unidadeDestinoId;
  }

  public void setUnidadeDestinoId(Long id) {
    this.unidadeDestinoId = id;
  }

  public Long getTransferId() {
    return transferId;
  }

  public void setTransferId(Long id) {
    this.transferId = id;
  }
}
