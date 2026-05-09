package com.portfolio.assetmanagement.unit.domain.asset;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;

import com.portfolio.assetmanagement.domain.asset.entity.Asset;
import com.portfolio.assetmanagement.domain.asset.enums.AssetStatus;
import com.portfolio.assetmanagement.domain.asset.enums.AssetType;
import com.portfolio.assetmanagement.domain.organization.entity.Organization;
import com.portfolio.assetmanagement.domain.unit.entity.Unit;
import com.portfolio.assetmanagement.domain.user.entity.User;
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
@Story("Mudança de status e atribuição")
@DisplayName("Asset — Status e Atribuição")
@Tag("testType=Unit")
@Tag("module=Domain")
class AssetStatusTest {

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
  @DisplayName("AT10 - Deve alterar status corretamente")
  void at10DeveAlterarStatus() {
    Asset asset = buildAsset();
    asset.changeStatus(AssetStatus.IN_MAINTENANCE);
    assertThat(asset.getStatus()).isEqualTo(AssetStatus.IN_MAINTENANCE);
  }

  @Test
  @Severity(SeverityLevel.NORMAL)
  @DisplayName("AT11 - Deve falhar quando status é nulo")
  void at11DeveLancarQuandoStatusNulo() {
    Asset asset = buildAsset();
    assertThatThrownBy(() -> asset.changeStatus(null))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessageContaining("status");
  }

  @Test
  @Severity(SeverityLevel.CRITICAL)
  @DisplayName("AT12 - assignToUser deve definir usuário e status ASSIGNED")
  void at12DeveAtribuirUsuarioEDefinirStatusAssigned() {
    Asset asset = buildAsset();
    User user = mock(User.class);

    asset.assignToUser(user);

    assertThat(asset.getAssignedUser()).isSameAs(user);
    assertThat(asset.getStatus()).isEqualTo(AssetStatus.ASSIGNED);
  }

  @Test
  @Severity(SeverityLevel.NORMAL)
  @DisplayName("AT13 - assignToUser deve falhar quando user é nulo")
  void at13DeveLancarQuandoUserNulo() {
    Asset asset = buildAsset();
    assertThatThrownBy(() -> asset.assignToUser(null))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessageContaining("user");
  }

  @Test
  @Severity(SeverityLevel.CRITICAL)
  @DisplayName("AT14 - unassignUser deve limpar usuário e retornar status AVAILABLE")
  void at14DeveDesatribuirUsuarioEDefinirStatusAvailable() {
    Asset asset = buildAsset();
    asset.assignToUser(mock(User.class));

    asset.unassignUser();

    assertThat(asset.getAssignedUser()).isNull();
    assertThat(asset.getStatus()).isEqualTo(AssetStatus.AVAILABLE);
  }
}
