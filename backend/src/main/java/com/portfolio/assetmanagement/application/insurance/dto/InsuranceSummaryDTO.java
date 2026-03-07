package com.portfolio.assetmanagement.application.insurance.dto;

import java.math.BigDecimal;

public class InsuranceSummaryDTO {

  private long expiringIn30Days;
  private BigDecimal totalCoverageExpiring;

  public long getExpiringIn30Days() {
    return expiringIn30Days;
  }

  public void setExpiringIn30Days(long v) {
    this.expiringIn30Days = v;
  }

  public BigDecimal getTotalCoverageExpiring() {
    return totalCoverageExpiring;
  }

  public void setTotalCoverageExpiring(BigDecimal v) {
    this.totalCoverageExpiring = v;
  }
}
