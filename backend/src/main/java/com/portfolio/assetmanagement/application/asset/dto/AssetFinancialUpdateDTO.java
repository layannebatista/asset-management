package com.portfolio.assetmanagement.application.asset.dto;

import com.portfolio.assetmanagement.domain.depreciation.enums.DepreciationMethod;
import java.math.BigDecimal;
import java.time.LocalDate;

public class AssetFinancialUpdateDTO {

  private BigDecimal purchaseValue;
  private BigDecimal residualValue;
  private Integer usefulLifeMonths;
  private DepreciationMethod depreciationMethod;
  private LocalDate purchaseDate;
  private LocalDate warrantyExpiry;
  private String supplier;
  private String invoiceNumber;
  private LocalDate invoiceDate;

  public AssetFinancialUpdateDTO() {}

  public BigDecimal getPurchaseValue() { return purchaseValue; }
  public void setPurchaseValue(BigDecimal v) { this.purchaseValue = v; }
  public BigDecimal getResidualValue() { return residualValue; }
  public void setResidualValue(BigDecimal v) { this.residualValue = v; }
  public Integer getUsefulLifeMonths() { return usefulLifeMonths; }
  public void setUsefulLifeMonths(Integer v) { this.usefulLifeMonths = v; }
  public DepreciationMethod getDepreciationMethod() { return depreciationMethod; }
  public void setDepreciationMethod(DepreciationMethod v) { this.depreciationMethod = v; }
  public LocalDate getPurchaseDate() { return purchaseDate; }
  public void setPurchaseDate(LocalDate v) { this.purchaseDate = v; }
  public LocalDate getWarrantyExpiry() { return warrantyExpiry; }
  public void setWarrantyExpiry(LocalDate v) { this.warrantyExpiry = v; }
  public String getSupplier() { return supplier; }
  public void setSupplier(String v) { this.supplier = v; }
  public String getInvoiceNumber() { return invoiceNumber; }
  public void setInvoiceNumber(String v) { this.invoiceNumber = v; }
  public LocalDate getInvoiceDate() { return invoiceDate; }
  public void setInvoiceDate(LocalDate v) { this.invoiceDate = v; }
}