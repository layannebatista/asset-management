package com.portfolio.assetmanagement.domain.depreciation.enums;

/**
 * Métodos de depreciação suportados.
 *
 * <ul>
 *   <li>{@code LINEAR} — quota constante por período (mais simples, CPC 27)
 *   <li>{@code DECLINING_BALANCE} — saldo decrescente, deprecia mais rápido no início (IFRS 16)
 *   <li>{@code SUM_OF_YEARS} — soma dos dígitos dos anos, acelerado para TI e veículos
 * </ul>
 */
public enum DepreciationMethod {
  LINEAR,
  DECLINING_BALANCE,
  SUM_OF_YEARS
}
