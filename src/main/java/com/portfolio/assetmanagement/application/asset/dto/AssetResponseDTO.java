package com.portfolio.assetmanagement.application.asset.dto;

import com.portfolio.assetmanagement.domain.asset.enums.AssetStatus;
import com.portfolio.assetmanagement.domain.asset.enums.AssetType;

/**
 * DTO responsável por representar a resposta da API para um ativo.
 *
 * <p>Define os dados públicos e seguros do ativo, evitando o vazamento de informações internas da
 * entidade.
 */
public class AssetResponseDTO {

  private Long id;
  private String assetTag;
  private AssetType type;
  private String model;
  private AssetStatus status;
  private Long organizationId;
  private Long unitId;
  private Long assignedUserId;

  public AssetResponseDTO() {}

  public AssetResponseDTO(
      Long id,
      String assetTag,
      AssetType type,
      String model,
      AssetStatus status,
      Long organizationId,
      Long unitId,
      Long assignedUserId) {

    this.id = id;
    this.assetTag = assetTag;
    this.type = type;
    this.model = model;
    this.status = status;
    this.organizationId = organizationId;
    this.unitId = unitId;
    this.assignedUserId = assignedUserId;
  }

  public Long getId() {
    return id;
  }

  public String getAssetTag() {
    return assetTag;
  }

  public AssetType getType() {
    return type;
  }

  public String getModel() {
    return model;
  }

  public AssetStatus getStatus() {
    return status;
  }

  public Long getOrganizationId() {
    return organizationId;
  }

  public Long getUnitId() {
    return unitId;
  }

  public Long getAssignedUserId() {
    return assignedUserId;
  }
}
