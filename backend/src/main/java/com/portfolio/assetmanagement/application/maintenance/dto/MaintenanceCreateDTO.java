package com.portfolio.assetmanagement.application.maintenance.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * DTO usado para criação de um registro de manutenção.
 *
 * <p>Representa os dados fornecidos pelo cliente para solicitar manutenção de um ativo.
 */
public class MaintenanceCreateDTO {

  @NotNull(message = "assetId é obrigatório")
  private Long assetId;

  @NotBlank(message = "Descrição é obrigatória")
  @Size(min = 10, max = 1000, message = "Descrição deve ter entre 10 e 1000 caracteres")
  private String description;

  public MaintenanceCreateDTO() {}

  public Long getAssetId() {
    return assetId;
  }

  public void setAssetId(Long assetId) {
    this.assetId = assetId;
  }

  public String getDescription() {
    return description;
  }

  public void setDescription(String description) {
    this.description = description;
  }
}
