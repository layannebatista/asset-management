package com.portfolio.assetmanagement.unit.domain.asset;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;

import com.portfolio.assetmanagement.domain.asset.entity.Asset;
import com.portfolio.assetmanagement.domain.asset.enums.AssetStatus;
import com.portfolio.assetmanagement.domain.asset.enums.AssetType;
import com.portfolio.assetmanagement.domain.organization.entity.Organization;
import com.portfolio.assetmanagement.domain.unit.entity.Unit;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import io.qameta.allure.Severity;
import io.qameta.allure.SeverityLevel;
import io.qameta.allure.Story;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@Epic("Backend")
@Feature("Domínio — Asset")
@Story("Transferência de unidade")
@DisplayName("Asset — Transferência")
@Tag("testType=Unit")
@Tag("module=Domain")
class AssetTransferTest {

  private Organization org;
  private Unit unit;

  @BeforeEach
  void setUp() {
    org = mock(Organization.class);
    unit = mock(Unit.class);
  }

  private Asset buildAsset() {
    return new Asset("TAG-001", AssetType.NOTEBOOK, "Dell XPS 15", org, unit);
  }

  @Test
  @Severity(SeverityLevel.CRITICAL)
  @DisplayName("AT15 - changeUnit deve definir nova unidade e status IN_TRANSFER")
  void at15DeveDefinirNovaUnidadeEStatusInTransfer() {
    Asset asset = buildAsset();
    Unit novaUnidade = mock(Unit.class);

    asset.changeUnit(novaUnidade);

    assertThat(asset.getUnit()).isSameAs(novaUnidade);
    assertThat(asset.getStatus()).isEqualTo(AssetStatus.IN_TRANSFER);
  }

  @Test
  @Severity(SeverityLevel.NORMAL)
  @DisplayName("AT16 - changeUnit deve falhar quando unit é nula")
  void at16DeveLancarQuandoUnitNula() {
    Asset asset = buildAsset();
    assertThatThrownBy(() -> asset.changeUnit(null))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessageContaining("unit");
  }

  @Test
  @Severity(SeverityLevel.CRITICAL)
  @DisplayName("AT17 - completeTransfer deve aplicar nova unidade e status AVAILABLE")
  void at17DeveConcluirTransferenciaComStatusAvailable() {
    Asset asset = buildAsset();
    Unit novaUnidade = mock(Unit.class);

    asset.completeTransfer(novaUnidade);

    assertThat(asset.getUnit()).isSameAs(novaUnidade);
    assertThat(asset.getStatus()).isEqualTo(AssetStatus.AVAILABLE);
  }

  @Test
  @Severity(SeverityLevel.NORMAL)
  @DisplayName("AT18 - completeTransfer deve falhar quando unit é nula")
  void at18DeveLancarQuandoNovaUnitNula() {
    Asset asset = buildAsset();
    assertThatThrownBy(() -> asset.completeTransfer(null))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessageContaining("unit");
  }
}
