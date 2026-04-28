package com.portfolio.assetmanagement.unit.domain.maintenance;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.portfolio.assetmanagement.domain.asset.entity.Asset;
import com.portfolio.assetmanagement.domain.asset.enums.AssetStatus;
import com.portfolio.assetmanagement.domain.maintenance.entity.MaintenanceRecord;
import com.portfolio.assetmanagement.domain.maintenance.enums.MaintenanceStatus;
import com.portfolio.assetmanagement.domain.organization.entity.Organization;
import com.portfolio.assetmanagement.domain.unit.entity.Unit;
import com.portfolio.assetmanagement.shared.exception.BusinessException;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import io.qameta.allure.Severity;
import io.qameta.allure.SeverityLevel;
import io.qameta.allure.Story;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

@Epic("Backend")
@Feature("Domínio — Manutenção")
@Story("Criação de manutenção")
@DisplayName("MaintenanceRecord — Construtor")
@Tag("testType=Unit")
@Tag("module=Domain")
class MaintenanceRecordConstructorTest {

  private Asset buildAsset(Long orgId, Long unitId) {
    Organization org = mock(Organization.class);
    when(org.getId()).thenReturn(orgId);
    Unit unit = mock(Unit.class);
    when(unit.getId()).thenReturn(unitId);
    when(unit.getOrganization()).thenReturn(org);
    Asset asset = mock(Asset.class);
    when(asset.getOrganization()).thenReturn(org);
    when(asset.getUnit()).thenReturn(unit);
    when(asset.getStatus()).thenReturn(AssetStatus.AVAILABLE);
    return asset;
  }

  @Test
  @Severity(SeverityLevel.CRITICAL)
  @DisplayName("MR01 - Deve iniciar como REQUESTED com datas corretas")
  void mr01DeveCriarComStatusRequestedECreatedAt() {
    Asset asset = buildAsset(1L, 10L);
    MaintenanceRecord record =
        new MaintenanceRecord(asset, 1L, 10L, 99L, "Descrição válida com mais de 10 chars");

    assertThat(record.getStatus()).isEqualTo(MaintenanceStatus.REQUESTED);
    assertThat(record.getCreatedAt()).isNotNull();
    assertThat(record.getStartedAt()).isNull();
    assertThat(record.getCompletedAt()).isNull();
  }

  @Test
  @Severity(SeverityLevel.CRITICAL)
  @DisplayName("MR02 - Deve falhar quando asset é null")
  void mr02DeveLancarQuandoAssetNull() {
    assertThatThrownBy(() -> new MaintenanceRecord(null, 1L, 10L, 99L, "Descrição válida aqui"))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessageContaining("asset é obrigatório");
  }

  @Test
  @Severity(SeverityLevel.NORMAL)
  @DisplayName("MR03 - Deve falhar quando descrição é inválida")
  void mr03DeveLancarQuandoDescricaoBlank() {
    Asset asset = buildAsset(1L, 10L);

    assertThatThrownBy(() -> new MaintenanceRecord(asset, 1L, 10L, 99L, "   "))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessageContaining("description é obrigatório");
  }

  @Test
  @Severity(SeverityLevel.CRITICAL)
  @DisplayName("MR04 - Deve falhar quando asset pertence a outra organização")
  void mr04DeveLancarQuandoAssetDeOutraOrg() {
    Asset asset = buildAsset(2L, 10L);

    assertThatThrownBy(() -> new MaintenanceRecord(asset, 1L, 10L, 99L, "Descrição válida aqui"))
        .isInstanceOf(BusinessException.class)
        .hasMessageContaining("Asset não pertence à organization");
  }
}
