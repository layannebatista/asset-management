package com.portfolio.assetmanagement.bdd.builder;

import com.portfolio.assetmanagement.bdd.support.TestDataHelper;
import com.portfolio.assetmanagement.domain.organization.entity.Organization;

public class OrganizationBuilder {

  private String name = "Org Teste";

  public static OrganizationBuilder anOrganization() {
    return new OrganizationBuilder();
  }

  public OrganizationBuilder withName(String name) {
    this.name = name;
    return this;
  }

  public Organization build(TestDataHelper helper) {
    return helper.criarOrganizacao(name);
  }
}
