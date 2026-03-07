package com.portfolio.assetmanagement.application.maintenance.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

/** Relatório de orçamento de manutenção: estimado vs real. */
public class MaintenanceBudgetDTO {

  private BigDecimal totalEstimatedCost;
  private BigDecimal totalActualCost;
  private BigDecimal variance; // actual - estimated (positivo = acima do orçado)
  private long totalRecords;
  private long completedRecords;
  private LocalDate periodStart;
  private LocalDate periodEnd;

  public BigDecimal getTotalEstimatedCost() {
    return totalEstimatedCost;
  }

  public void setTotalEstimatedCost(BigDecimal v) {
    this.totalEstimatedCost = v;
  }

  public BigDecimal getTotalActualCost() {
    return totalActualCost;
  }

  public void setTotalActualCost(BigDecimal v) {
    this.totalActualCost = v;
  }

  public BigDecimal getVariance() {
    return variance;
  }

  public void setVariance(BigDecimal v) {
    this.variance = v;
  }

  public long getTotalRecords() {
    return totalRecords;
  }

  public void setTotalRecords(long v) {
    this.totalRecords = v;
  }

  public long getCompletedRecords() {
    return completedRecords;
  }

  public void setCompletedRecords(long v) {
    this.completedRecords = v;
  }

  public LocalDate getPeriodStart() {
    return periodStart;
  }

  public void setPeriodStart(LocalDate v) {
    this.periodStart = v;
  }

  public LocalDate getPeriodEnd() {
    return periodEnd;
  }

  public void setPeriodEnd(LocalDate v) {
    this.periodEnd = v;
  }
}
