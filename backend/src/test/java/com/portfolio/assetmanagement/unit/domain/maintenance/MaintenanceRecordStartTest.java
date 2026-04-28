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
@Story("Execução de manutenção")
@DisplayName("MaintenanceRecord — Iniciar")
@Tag("testType=Unit")
@Tag("module=Domain")
class MaintenanceRecordStartTest {

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

  private MaintenanceRecord buildRecord() {
    Asset asset = buildAsset(1L, 10L);
    return new MaintenanceRecord(asset, 1L, 10L, 99L, "Descrição válida com mais de 10 chars");
  }

  @Test
  @Severity(SeverityLevel.CRITICAL)
  @DisplayName("MR05 - Deve iniciar manutenção corretamente")
  void mr05DeveIniciarCorretamente() {
    MaintenanceRecord record = buildRecord();

    record.start(42L);

    assertThat(record.getStatus()).isEqualTo(MaintenanceStatus.IN_PROGRESS);
    assertThat(record.getStartedByUserId()).isEqualTo(42L);
    assertThat(record.getStartedAt()).isNotNull();
  }

  @Test
  @Severity(SeverityLevel.CRITICAL)
  @DisplayName("MR06 - Deve falhar ao iniciar fora do estado REQUESTED")
  void mr06DeveLancarQuandoStatusNaoEhRequested() {
    MaintenanceRecord record = buildRecord();
    record.start(42L);

    assertThatThrownBy(() -> record.start(42L))
        .isInstanceOf(BusinessException.class)
        .hasMessageContaining("Somente manutenção REQUESTED pode ser iniciada");
  }

  @Test
  @Severity(SeverityLevel.NORMAL)
  @DisplayName("MR07 - Deve falhar quando userId é null ao iniciar")
  void mr07DeveLancarQuandoUserIdNull() {
    MaintenanceRecord record = buildRecord();

    assertThatThrownBy(() -> record.start(null))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessageContaining("userId é obrigatório");
  }
}
