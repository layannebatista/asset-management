package com.portfolio.assetmanagement.unit.domain.insurance;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.portfolio.assetmanagement.domain.insurance.entity.AssetInsurance;
import java.math.BigDecimal;
import java.time.LocalDate;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@DisplayName("AssetInsurance — domínio")
@Tag("testType=Unit")
@Tag("module=Domain")
class AssetInsuranceEntityTest {

  @Test
  @DisplayName("INS-U01 - criação válida inicia ativa")
  void criacaoValidaIniciaAtiva() {
    AssetInsurance insurance =
        new AssetInsurance(
            1L,
            1L,
            "POL-001",
            "Seguradora X",
            new BigDecimal("1000.00"),
            new BigDecimal("100.00"),
            LocalDate.now().minusDays(1),
            LocalDate.now().plusDays(30));

    assertThat(insurance.isActive()).isTrue();
  }

  @Test
  @DisplayName("INS-U02 - expiryDate deve ser posterior a startDate")
  void expiryDatePosteriorObrigatorio() {
    assertThatThrownBy(
            () ->
                new AssetInsurance(
                    1L,
                    1L,
                    "POL-001",
                    "Seguradora X",
                    new BigDecimal("1000.00"),
                    new BigDecimal("100.00"),
                    LocalDate.now(),
                    LocalDate.now().minusDays(1)))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessageContaining("expiryDate deve ser posterior");
  }
}
