package com.portfolio.assetmanagement.application.depreciation.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

/** Valoração consolidada do portfólio de ativos da organização. */
public class PortfolioValueDTO {

  private BigDecimal totalPurchaseValue; // Valor total de aquisição
  private BigDecimal totalCurrentValue; // Valor contábil atual (depreciado)
  private BigDecimal totalDepreciation; // Depreciação acumulada total
  private BigDecimal depreciationPercentage; // % do portfólio depreciado
  private long totalAssets; // Ativos com depreciação configurada
  private LocalDate calculationDate;

  public BigDecimal getTotalPurchaseValue() {
    return totalPurchaseValue;
  }

  public void setTotalPurchaseValue(BigDecimal v) {
    this.totalPurchaseValue = v;
  }

  public BigDecimal getTotalCurrentValue() {
    return totalCurrentValue;
  }

  public void setTotalCurrentValue(BigDecimal v) {
    this.totalCurrentValue = v;
  }

  public BigDecimal getTotalDepreciation() {
    return totalDepreciation;
  }

  public void setTotalDepreciation(BigDecimal v) {
    this.totalDepreciation = v;
  }

  public BigDecimal getDepreciationPercentage() {
    return depreciationPercentage;
  }

  public void setDepreciationPercentage(BigDecimal v) {
    this.depreciationPercentage = v;
  }

  public long getTotalAssets() {
    return totalAssets;
  }

  public void setTotalAssets(long v) {
    this.totalAssets = v;
  }

  public LocalDate getCalculationDate() {
    return calculationDate;
  }

  public void setCalculationDate(LocalDate v) {
    this.calculationDate = v;
  }
}
