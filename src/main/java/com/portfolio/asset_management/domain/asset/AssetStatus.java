package com.portfolio.asset_management.domain.asset;

import java.util.EnumSet;
import java.util.Set;

/**
 * Representa o estado atual do Ativo dentro do seu ciclo de vida.
 *
 * Este enum descreve SOMENTE estados possíveis.
 * Regras de transição e validações ficam no domínio (Asset).
 *
 
 */
public enum AssetStatus {

  /**
   * Ativo recém-cadastrado no sistema.
   * Ainda não está em uso.
   */
  CADASTRADO(EnumSet.of(
      AssetAction.ATIVAR
  )),

  /**
   * Ativo em uso normal.
   */
  EM_USO(EnumSet.of(
      AssetAction.SOLICITAR_TRANSFERENCIA,
      AssetAction.ENVIAR_PARA_MANUTENCAO,
      AssetAction.INICIAR_INVENTARIO,
      AssetAction.BAIXAR
  )),

  /**
   * Transferência solicitada e aguardando aprovação.
   */
  TRANSFERENCIA_SOLICITADA(EnumSet.of(
      AssetAction.APROVAR_TRANSFERENCIA,
      AssetAction.REJEITAR_TRANSFERENCIA
  )),

  /**
   * Transferência aprovada e aguardando confirmação de recebimento.
   */
  TRANSFERENCIA_APROVADA(EnumSet.of(
      AssetAction.CONFIRMAR_RECEBIMENTO
  )),

  /**
   * Ativo em manutenção.
   */
  EM_MANUTENCAO(EnumSet.of(
      AssetAction.RETORNAR_DA_MANUTENCAO
  )),

  /**
   * Ativo em processo de inventário/conferência.
   */
  EM_INVENTARIO(EnumSet.of(
      AssetAction.CONFIRMAR_LOCALIZADO,
      AssetAction.MARCAR_NAO_LOCALIZADO
  )),

  /**
   * Ativo não localizado durante inventário.
   */
  NAO_LOCALIZADO(EnumSet.of(
      AssetAction.LOCALIZAR_ATIVO,
      AssetAction.BAIXAR
  )),

  /**
   * Estado final do ativo.
   */
  BAIXADO(EnumSet.noneOf(AssetAction.class));

  private final Set<AssetAction> allowedActions;

  AssetStatus(Set<AssetAction> allowedActions) {
    this.allowedActions = allowedActions;
  }

  /* ======================================================
     API DE DOMÍNIO (BDD FRIENDLY)
     ====================================================== */

  public boolean permite(AssetAction action) {
    return allowedActions.contains(action);
  }

  public boolean isTerminal() {
    return this == BAIXADO;
  }

  public Set<AssetAction> getAllowedActions() {
    return EnumSet.copyOf(allowedActions);
  }
}
