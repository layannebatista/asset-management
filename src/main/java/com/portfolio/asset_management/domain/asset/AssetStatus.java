package com.portfolio.asset_management.domain.asset;

/**
 * Representa o estado REAL do ativo ao longo do seu ciclo de vida.
 *
 * Regras importantes:
 * - Estados representam a situação física/operacional do ativo
 * - Estados NÃO representam telas, permissões ou workflows
 * - BAIXADO é estado final e não permite transição
 */
public enum AssetStatus {

    /**
     * Ativo criado no sistema, ainda não está em uso.
     */
    CADASTRADO,

    /**
     * Ativo em uso normal pela empresa.
     */
    EM_USO,

    /**
     * Ativo em processo de transferência.
     * Durante esse estado, o ativo fica bloqueado.
     */
    EM_TRANSFERENCIA,

    /**
     * Ativo indisponível por manutenção.
     */
    EM_MANUTENCAO,

    /**
     * Ativo não localizado durante inventário.
     */
    NAO_LOCALIZADO,

    /**
     * Estado final. Ativo baixado definitivamente.
     */
    BAIXADO
}
