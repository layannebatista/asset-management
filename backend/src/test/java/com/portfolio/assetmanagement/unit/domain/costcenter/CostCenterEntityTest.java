package com.portfolio.assetmanagement.unit.domain.costcenter;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.portfolio.assetmanagement.domain.costcenter.entity.CostCenter;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Tag;

@DisplayName("CostCenter — domínio")
@Tag("testType=Unit")
@Tag("module=Domain")
class CostCenterEntityTest {

  @Test
  @DisplayName("CC-U01 - code é normalizado para upper case")
  void codeNormalizadoUpperCase() {
    CostCenter cc = new CostCenter(1L, 2L, "fin", "Financeiro");
    assertThat(cc.getCode()).isEqualTo("FIN");
  }

  @Test
  @DisplayName("CC-U02 - organizationId obrigatório")
  void organizationIdObrigatorio() {
    assertThatThrownBy(() -> new CostCenter(null, 2L, "FIN", "Financeiro"))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessageContaining("organizationId obrigatório");
  }
}
