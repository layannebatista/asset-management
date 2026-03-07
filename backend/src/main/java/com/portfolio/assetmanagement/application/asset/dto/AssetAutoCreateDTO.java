package com.portfolio.assetmanagement.application.asset.dto;

import com.portfolio.assetmanagement.domain.asset.enums.AssetType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * DTO para criação automática de ativo com assetTag gerado pelo sistema.
 *
 * <p>Utilizado exclusivamente no endpoint POST /{organizationId}/auto. Não possui o campo assetTag
 * pois ele é gerado automaticamente pelo AssetNumberGeneratorService.
 */
public class AssetAutoCreateDTO {

  @NotNull(message = "Tipo do ativo é obrigatório")
  private AssetType type;

  @NotBlank(message = "Modelo do ativo é obrigatório")
  private String model;

  @NotNull(message = "Unidade é obrigatória")
  private Long unitId;

  public AssetAutoCreateDTO() {}

  public AssetType getType() {
    return type;
  }

  public String getModel() {
    return model;
  }

  public Long getUnitId() {
    return unitId;
  }

  public void setType(AssetType type) {
    this.type = type;
  }

  public void setModel(String model) {
    this.model = model;
  }

  public void setUnitId(Long unitId) {
    this.unitId = unitId;
  }
}
