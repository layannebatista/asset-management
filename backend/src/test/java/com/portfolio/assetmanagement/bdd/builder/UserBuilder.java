package com.portfolio.assetmanagement.bdd.builder;

import com.portfolio.assetmanagement.bdd.support.TestDataHelper;
import com.portfolio.assetmanagement.domain.organization.entity.Organization;
import com.portfolio.assetmanagement.domain.unit.entity.Unit;
import com.portfolio.assetmanagement.domain.user.entity.User;
import com.portfolio.assetmanagement.security.enums.UserRole;

public class UserBuilder {

  private String email = "user@test.com";
  private String password = "Senha@123";
  private UserRole role = UserRole.OPERADOR;
  private Organization organization;
  private Unit unit;

  public static UserBuilder aUser() {
    return new UserBuilder();
  }

  public UserBuilder withEmail(String email) {
    this.email = email;
    return this;
  }

  public UserBuilder withPassword(String password) {
    this.password = password;
    return this;
  }

  public UserBuilder withRole(UserRole role) {
    this.role = role;
    return this;
  }

  public UserBuilder inOrganization(Organization organization) {
    this.organization = organization;
    return this;
  }

  public UserBuilder inUnit(Unit unit) {
    this.unit = unit;
    return this;
  }

  public User build(TestDataHelper helper) {
    return helper.criarUsuarioAtivo(email, password, role, organization, unit);
  }
}
