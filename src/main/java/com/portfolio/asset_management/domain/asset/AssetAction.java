package com.portfolio.asset_management.domain.asset;

/**
 * Representa ações de negócio possíveis sobre um Ativo.
 *
 * <p>Este enum faz parte da linguagem ubíqua do domínio. Cada ação representa uma intenção
 * explícita do negócio, e NÃO uma simples mudança de status.
 *
 * <p>As permissões de execução são controladas pelo AssetStatus. As regras de execução ficam no
 * domínio (Asset).
 */
public enum AssetAction {

  /** Ativar um ativo recém-cadastrado, tornando-o disponível para uso. */
  ATIVAR,

  /** Solicitar a transferência de um ativo para outra unidade. */
  SOLICITAR_TRANSFERENCIA,

  /** Aprovar uma transferência solicitada. */
  APROVAR_TRANSFERENCIA,

  /** Rejeitar uma transferência solicitada. */
  REJEITAR_TRANSFERENCIA,

  /** Confirmar o recebimento físico do ativo após aprovação da transferência. */
  CONFIRMAR_RECEBIMENTO,

  /** Enviar o ativo para manutenção. */
  ENVIAR_PARA_MANUTENCAO,

  /** Retornar o ativo da manutenção. */
  RETORNAR_DA_MANUTENCAO,

  /** Iniciar o processo de inventário/conferência do ativo. */
  INICIAR_INVENTARIO,

  /** Confirmar que o ativo foi localizado durante o inventário. */
  CONFIRMAR_LOCALIZADO,

  /** Marcar o ativo como não localizado durante o inventário. */
  MARCAR_NAO_LOCALIZADO,

  /** Localizar novamente um ativo anteriormente marcado como não localizado. */
  LOCALIZAR_ATIVO,

  /** Baixar definitivamente o ativo. */
  BAIXAR
}
