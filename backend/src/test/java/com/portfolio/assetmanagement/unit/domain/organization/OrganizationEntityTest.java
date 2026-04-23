package com.portfolio.assetmanagement.unit.domain.organization;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.portfolio.assetmanagement.domain.organization.entity.Organization;
import com.portfolio.assetmanagement.domain.organization.enums.OrganizationStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@DisplayName("Organization — domínio")
class OrganizationEntityTest {

  @Test
  @DisplayName("ORG-U01 - construtor inicia organização como ACTIVE")
  void construtorIniciaActive() {
    Organization org = new Organization("Acme");
    assertThat(org.getStatus()).isEqualTo(OrganizationStatus.ACTIVE);
  }

  @Test
  @DisplayName("ORG-U02 - nome obrigatório")
  void nomeObrigatorio() {
    assertThatThrownBy(() -> new Organization("  "))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessageContaining("Nome da organização é obrigatório");
  }

  @Test
  @DisplayName("ORG-U03 - setStatus não aceita null")
  void setStatusNaoAceitaNull() {
    Organization org = new Organization("Acme");
    assertThatThrownBy(() -> org.setStatus(null))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessageContaining("status não pode ser null");
  }
}
