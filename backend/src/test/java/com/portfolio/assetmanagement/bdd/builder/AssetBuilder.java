package com.portfolio.assetmanagement.bdd.builder;

import com.portfolio.assetmanagement.bdd.support.TestDataHelper;
import com.portfolio.assetmanagement.domain.asset.entity.Asset;
import com.portfolio.assetmanagement.domain.asset.enums.AssetStatus;
import com.portfolio.assetmanagement.domain.asset.enums.AssetType;
import com.portfolio.assetmanagement.domain.organization.entity.Organization;
import com.portfolio.assetmanagement.domain.unit.entity.Unit;

public class AssetBuilder {

  private String assetTag = "ASSET-TEST-BUILDER";
  private AssetType type = AssetType.NOTEBOOK;
  private String model = "Modelo Builder";
  private AssetStatus status = AssetStatus.AVAILABLE;
  private Organization organization;
  private Unit unit;

  public static AssetBuilder anAsset() {
    return new AssetBuilder();
  }

  public AssetBuilder withAssetTag(String assetTag) {
    this.assetTag = assetTag;
    return this;
  }

  public AssetBuilder withType(AssetType type) {
    this.type = type;
    return this;
  }

  public AssetBuilder withModel(String model) {
    this.model = model;
    return this;
  }

  public AssetBuilder withStatus(AssetStatus status) {
    this.status = status;
    return this;
  }

  public AssetBuilder inOrganization(Organization organization) {
    this.organization = organization;
    return this;
  }

  public AssetBuilder inUnit(Unit unit) {
    this.unit = unit;
    return this;
  }

  public Asset build(TestDataHelper helper) {
    return helper.criarAtivoComStatus(assetTag, type, model, organization, unit, status);
  }
}
