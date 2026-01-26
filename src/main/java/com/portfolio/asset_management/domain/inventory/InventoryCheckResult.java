package com.portfolio.asset_management.domain.inventory;

/**
 * Resultado da conferência de um ativo
 * durante um ciclo de inventário.
 */
public enum InventoryCheckResult {

    /**
     * Ativo localizado fisicamente.
     */
    LOCALIZADO,

    /**
     * Ativo não localizado durante o inventário.
     */
    NAO_LOCALIZADO
}
