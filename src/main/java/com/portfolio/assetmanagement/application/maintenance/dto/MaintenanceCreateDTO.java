package com.portfolio.assetmanagement.application.maintenance.dto;

/**
 * DTO usado para criação de um registro de manutenção.
 *
 * <p>Representa os dados fornecidos pelo cliente para solicitar manutenção de um ativo.
 */
public class MaintenanceCreateDTO {

  private Long assetId;

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