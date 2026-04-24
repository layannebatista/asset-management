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
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Tag;

@Epic("Backend")
@Feature("Domínio — Asset")
@Story("Aposentadoria de ativo")
@DisplayName("Asset — Retire")
@Tag("testType=Unit")
@Tag("module=Domain")
class AssetRetireTest {

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
  @DisplayName("AT19 - Deve aposentar ativo disponível, limpar usuário e definir status RETIRED")
  void at19DeveAposentarAtivo() {
    Asset asset = buildAsset();
    asset.assignToUser(mock(com.portfolio.assetmanagement.domain.user.entity.User.class));

    asset.retire();

    assertThat(asset.getStatus()).isEqualTo(AssetStatus.RETIRED);
    assertThat(asset.getAssignedUser()).isNull();
  }

  @Test
  @Severity(SeverityLevel.NORMAL)
  @DisplayName("AT20 - Deve falhar ao aposentar ativo já aposentado")
  void at20DeveLancarQuandoJaAposentado() {
    Asset asset = buildAsset();
    asset.retire();

    assertThatThrownBy(asset::retire)
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessageContaining("aposentado");
  }
}
