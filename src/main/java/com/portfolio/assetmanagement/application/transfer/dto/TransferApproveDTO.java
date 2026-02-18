package com.portfolio.assetmanagement.application.transfer.dto;

/**
 * DTO utilizado nas ações de aprovação ou rejeição de uma transferência.
 *
 * <p>Permite registrar um comentário opcional do gestor.
 */
public class TransferApproveDTO {

  private String comment;

  public TransferApproveDTO() {}

  public String getComment() {
    return comment;
  }

  public void setComment(String comment) {
    this.comment = comment;
  }
}