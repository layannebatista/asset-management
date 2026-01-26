package com.portfolio.asset_management.domain.maintenance;

/**
 * Representa o estado real de uma manutenção.
 *
 * Estados refletem o ciclo de vida da manutenção
 * e NÃO representam status do ativo.
 */
public enum MaintenanceStatus {

    /**
     * Manutenção criada e aguardando início.
     */
    ABERTA,

    /**
     * Manutenção em execução.
     */
    EM_EXECUCAO,

    /**
     * Manutenção finalizada com sucesso.
     */
    FINALIZADA,

    /**
     * Manutenção cancelada antes de iniciar.
     */
    CANCELADA
}
