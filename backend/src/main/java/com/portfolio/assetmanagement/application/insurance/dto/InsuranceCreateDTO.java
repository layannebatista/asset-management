package com.portfolio.assetmanagement.application.insurance.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;
import java.time.LocalDate;

public class InsuranceCreateDTO {

  @NotBlank(message = "Número da apólice é obrigatório")
  private String policyNumber;

  @NotBlank(message = "Seguradora é obrigatória")
  private String insurer;

  @NotNull(message = "Valor de cobertura é obrigatório")
  @Positive(message = "Valor de cobertura deve ser positivo")
  private BigDecimal coverageValue;

  @Positive(message = "Prêmio deve ser positivo")
  private BigDecimal premium;

  @NotNull(message = "Data de início é obrigatória")
  private LocalDate startDate;

  @NotNull(message = "Data de vencimento é obrigatória")
  private LocalDate expiryDate;

  public String getPolicyNumber() {
    return policyNumber;
  }

  public void setPolicyNumber(String v) {
    this.policyNumber = v;
  }

  public String getInsurer() {
    return insurer;
  }

  public void setInsurer(String v) {
    this.insurer = v;
  }

  public BigDecimal getCoverageValue() {
    return coverageValue;
  }

  public void setCoverageValue(BigDecimal v) {
    this.coverageValue = v;
  }

  public BigDecimal getPremium() {
    return premium;
  }

  public void setPremium(BigDecimal v) {
    this.premium = v;
  }

  public LocalDate getStartDate() {
    return startDate;
  }

  public void setStartDate(LocalDate v) {
    this.startDate = v;
  }

  public LocalDate getExpiryDate() {
    return expiryDate;
  }

  public void setExpiryDate(LocalDate v) {
    this.expiryDate = v;
  }
}
