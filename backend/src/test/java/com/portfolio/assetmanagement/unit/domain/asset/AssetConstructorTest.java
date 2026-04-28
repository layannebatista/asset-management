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
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

@Epic("Backend")
@Feature("Domínio — Asset")
@Story("Criação de ativo")
@DisplayName("Asset — Construtor")
@Tag("testType=Unit")
@Tag("module=Domain")
class AssetConstructorTest {

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
  @DisplayName("AT01 - Deve iniciar com status AVAILABLE")
  void at01DeveIniciarComStatusAvailable() {
    Asset asset = buildAsset();
    assertThat(asset.getStatus()).isEqualTo(AssetStatus.AVAILABLE);
  }

  @Test
  @Severity(SeverityLevel.CRITICAL)
  @DisplayName("AT02 - Deve armazenar assetTag, type e model corretamente")
  void at02DeveArmazenarCampos() {
    Asset asset = buildAsset();
    assertThat(asset.getAssetTag()).isEqualTo("TAG-001");
    assertThat(asset.getType()).isEqualTo(AssetType.NOTEBOOK);
    assertThat(asset.getModel()).isEqualTo("Dell XPS 15");
    assertThat(asset.getOrganization()).isSameAs(org);
    assertThat(asset.getUnit()).isSameAs(unit);
  }

  @Test
  @Severity(SeverityLevel.NORMAL)
  @DisplayName("AT03 - Deve falhar quando assetTag é nulo")
  void at03DeveLancarQuandoAssetTagNulo() {
    assertThatThrownBy(() -> new Asset(null, AssetType.NOTEBOOK, "Modelo", org, unit))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessageContaining("assetTag");
  }

  @Test
  @Severity(SeverityLevel.NORMAL)
  @DisplayName("AT04 - Deve falhar quando assetTag é vazio")
  void at04DeveLancarQuandoAssetTagVazio() {
    assertThatThrownBy(() -> new Asset("  ", AssetType.NOTEBOOK, "Modelo", org, unit))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessageContaining("assetTag");
  }

  @Test
  @Severity(SeverityLevel.NORMAL)
  @DisplayName("AT05 - Deve falhar quando type é nulo")
  void at05DeveLancarQuandoTypeNulo() {
    assertThatThrownBy(() -> new Asset("TAG-002", null, "Modelo", org, unit))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessageContaining("type");
  }

  @Test
  @Severity(SeverityLevel.NORMAL)
  @DisplayName("AT06 - Deve falhar quando model é nulo")
  void at06DeveLancarQuandoModelNulo() {
    assertThatThrownBy(() -> new Asset("TAG-003", AssetType.NOTEBOOK, null, org, unit))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessageContaining("model");
  }

  @Test
  @Severity(SeverityLevel.NORMAL)
  @DisplayName("AT07 - Deve falhar quando model é vazio")
  void at07DeveLancarQuandoModelVazio() {
    assertThatThrownBy(() -> new Asset("TAG-003", AssetType.NOTEBOOK, "  ", org, unit))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessageContaining("model");
  }

  @Test
  @Severity(SeverityLevel.NORMAL)
  @DisplayName("AT08 - Deve falhar quando organization é nula")
  void at08DeveLancarQuandoOrganizationNula() {
    assertThatThrownBy(() -> new Asset("TAG-004", AssetType.NOTEBOOK, "Modelo", null, unit))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessageContaining("organization");
  }

  @Test
  @Severity(SeverityLevel.NORMAL)
  @DisplayName("AT09 - Deve falhar quando unit é nula")
  void at09DeveLancarQuandoUnitNula() {
    assertThatThrownBy(() -> new Asset("TAG-005", AssetType.NOTEBOOK, "Modelo", org, null))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessageContaining("unit");
  }
}
