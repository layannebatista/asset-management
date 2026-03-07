package com.portfolio.assetmanagement.application.depreciation.dto;

import com.portfolio.assetmanagement.domain.depreciation.enums.DepreciationMethod;
import java.math.BigDecimal;
import java.time.LocalDate;

/** Resultado do cálculo de depreciação de um único ativo. */
public class DepreciationResultDTO {

  private Long assetId;
  private String assetTag;
  private String model;
  private DepreciationMethod depreciationMethod;

  private BigDecimal purchaseValue; // Valor de aquisição
  private BigDecimal residualValue; // Valor residual ao fim da vida útil
  private BigDecimal currentValue; // Valor contábil atual
  private BigDecimal accumulatedDepreciation; // Total depreciado até hoje

  private int usefulLifeMonths; // Vida útil total em meses
  private int elapsedMonths; // Meses decorridos desde aquisição
  private int remainingMonths; // Meses restantes de vida útil

  private BigDecimal depreciationPercentage; // % do valor depreciável já depreciado
  private boolean fullyDepreciated; // true se vida útil esgotada
  private LocalDate calculationDate;

  // Getters e Setters
  public Long getAssetId() {
    return assetId;
  }

  public void setAssetId(Long v) {
    this.assetId = v;
  }

  public String getAssetTag() {
    return assetTag;
  }

  public void setAssetTag(String v) {
    this.assetTag = v;
  }

  public String getModel() {
    return model;
  }

  public void setModel(String v) {
    this.model = v;
  }

  public DepreciationMethod getDepreciationMethod() {
    return depreciationMethod;
  }

  public void setDepreciationMethod(DepreciationMethod v) {
    this.depreciationMethod = v;
  }

  public BigDecimal getPurchaseValue() {
    return purchaseValue;
  }

  public void setPurchaseValue(BigDecimal v) {
    this.purchaseValue = v;
  }

  public BigDecimal getResidualValue() {
    return residualValue;
  }

  public void setResidualValue(BigDecimal v) {
    this.residualValue = v;
  }

  public BigDecimal getCurrentValue() {
    return currentValue;
  }

  public void setCurrentValue(BigDecimal v) {
    this.currentValue = v;
  }

  public BigDecimal getAccumulatedDepreciation() {
    return accumulatedDepreciation;
  }

  public void setAccumulatedDepreciation(BigDecimal v) {
    this.accumulatedDepreciation = v;
  }

  public int getUsefulLifeMonths() {
    return usefulLifeMonths;
  }

  public void setUsefulLifeMonths(int v) {
    this.usefulLifeMonths = v;
  }

  public int getElapsedMonths() {
    return elapsedMonths;
  }

  public void setElapsedMonths(int v) {
    this.elapsedMonths = v;
  }

  public int getRemainingMonths() {
    return remainingMonths;
  }

  public void setRemainingMonths(int v) {
    this.remainingMonths = v;
  }

  public BigDecimal getDepreciationPercentage() {
    return depreciationPercentage;
  }

  public void setDepreciationPercentage(BigDecimal v) {
    this.depreciationPercentage = v;
  }

  public boolean isFullyDepreciated() {
    return fullyDepreciated;
  }

  public void setFullyDepreciated(boolean v) {
    this.fullyDepreciated = v;
  }

  public LocalDate getCalculationDate() {
    return calculationDate;
  }

  public void setCalculationDate(LocalDate v) {
    this.calculationDate = v;
  }
}
