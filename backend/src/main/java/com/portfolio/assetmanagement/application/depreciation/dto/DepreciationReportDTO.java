package com.portfolio.assetmanagement.application.depreciation.dto;

import java.time.LocalDate;
import java.util.List;

/** Relatório detalhado de depreciação — todos os ativos da organização. */
public class DepreciationReportDTO {

  private List<DepreciationResultDTO> items;
  private int totalAssets;
  private LocalDate generatedAt;

  public List<DepreciationResultDTO> getItems() {
    return items;
  }

  public void setItems(List<DepreciationResultDTO> v) {
    this.items = v;
  }

  public int getTotalAssets() {
    return totalAssets;
  }

  public void setTotalAssets(int v) {
    this.totalAssets = v;
  }

  public LocalDate getGeneratedAt() {
    return generatedAt;
  }

  public void setGeneratedAt(LocalDate v) {
    this.generatedAt = v;
  }
}
