package com.portfolio.assetmanagement.application.maintenance.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public class MaintenanceCreateDTO {

  @NotNull(message = "assetId é obrigatório")
  private Long assetId;

  @NotBlank(message = "Descrição é obrigatória")
  @Size(min = 10, max = 1000, message = "Descrição deve ter entre 10 e 1000 caracteres")
  private String description;

  @DecimalMin(value = "0.01", message = "Custo estimado deve ser maior que zero")
  private BigDecimal estimatedCost;

  public MaintenanceCreateDTO() {}

  public Long getAssetId() { return assetId; }
  public void setAssetId(Long assetId) { this.assetId = assetId; }

  public String getDescription() { return description; }
  public void setDescription(String description) { this.description = description; }

  public BigDecimal getEstimatedCost() { return estimatedCost; }
  public void setEstimatedCost(BigDecimal estimatedCost) { this.estimatedCost = estimatedCost; }
}
