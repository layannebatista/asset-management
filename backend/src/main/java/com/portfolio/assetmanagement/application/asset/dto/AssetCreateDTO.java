package com.portfolio.assetmanagement.application.asset.dto;

import com.portfolio.assetmanagement.domain.asset.enums.AssetType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * DTO responsável por representar a requisição de criação de um ativo.
 *
 * <p>Utilizado para cadastro inicial de ativos no sistema.
 */
public class AssetCreateDTO {

  @NotBlank(message = "Identificador do ativo é obrigatório")
  private String assetTag;

  @NotNull(message = "Tipo do ativo é obrigatório")
  private AssetType type;

  @NotBlank(message = "Modelo do ativo é obrigatório")
  private String model;

  @NotNull(message = "Unidade é obrigatória")
  private Long unitId;

  public AssetCreateDTO() {}

  public String getAssetTag() {
    return assetTag;
  }

  public AssetType getType() {
    return type;
  }

  public String getModel() {
    return model;
  }

  public Long getUnitId() {
    return unitId;
  }

  public void setAssetTag(String assetTag) {
    this.assetTag = assetTag;
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
