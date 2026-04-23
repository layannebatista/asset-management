package com.portfolio.assetmanagement.unit.domain.unit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.portfolio.assetmanagement.domain.organization.entity.Organization;
import com.portfolio.assetmanagement.domain.unit.entity.Unit;
import com.portfolio.assetmanagement.domain.unit.enums.UnitStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@DisplayName("Unit — domínio")
class UnitEntityTest {

  @Test
  @DisplayName("UNIT-U01 - construtor inicia ACTIVE")
  void construtorIniciaActive() {
    Organization org = mock(Organization.class);
    when(org.getId()).thenReturn(1L);

    Unit unit = new Unit("Sede", org, false);

    assertThat(unit.getStatus()).isEqualTo(UnitStatus.ACTIVE);
  }

  @Test
  @DisplayName("UNIT-U02 - nome obrigatório")
  void nomeObrigatorio() {
    Organization org = mock(Organization.class);
    when(org.getId()).thenReturn(1L);

    assertThatThrownBy(() -> new Unit("   ", org, false))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessageContaining("Nome da unidade é obrigatório");
  }

  @Test
  @DisplayName("UNIT-U03 - organization obrigatória")
  void organizationObrigatoria() {
    assertThatThrownBy(() -> new Unit("Sede", null, false))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessageContaining("organization é obrigatório");
  }
}
