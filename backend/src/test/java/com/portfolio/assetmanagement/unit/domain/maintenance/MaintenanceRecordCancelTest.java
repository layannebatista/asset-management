package com.portfolio.assetmanagement.unit.domain.maintenance;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.portfolio.assetmanagement.domain.asset.entity.Asset;
import com.portfolio.assetmanagement.domain.asset.enums.AssetStatus;
import com.portfolio.assetmanagement.domain.maintenance.entity.MaintenanceRecord;
import com.portfolio.assetmanagement.domain.maintenance.enums.MaintenanceStatus;
import com.portfolio.assetmanagement.domain.organization.entity.Organization;
import com.portfolio.assetmanagement.domain.unit.entity.Unit;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import io.qameta.allure.Severity;
import io.qameta.allure.SeverityLevel;
import io.qameta.allure.Story;
import java.math.BigDecimal;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

@Epic("Backend")
@Feature("Domínio — Manutenção")
@Story("Execução de manutenção")
@DisplayName("MaintenanceRecord — Cancelar e Estados")
@Tag("testType=Unit")
@Tag("module=Domain")
class MaintenanceRecordCancelTest {

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
  @Severity(SeverityLevel.NORMAL)
  @DisplayName("MR10 - Deve cancelar manutenção no estado REQUESTED")
  void mr10DeveCancelarRequestedCorretamente() {
    MaintenanceRecord record = buildRecord();
    record.cancel();

    assertThat(record.getStatus()).isEqualTo(MaintenanceStatus.CANCELLED);
  }

  @Test
  @Severity(SeverityLevel.NORMAL)
  @DisplayName("MR11 - Deve cancelar manutenção no estado IN_PROGRESS")
  void mr11DeveCancelarInProgressCorretamente() {
    MaintenanceRecord record = buildRecord();
    record.start(42L);
    record.cancel();

    assertThat(record.getStatus()).isEqualTo(MaintenanceStatus.CANCELLED);
  }

  @Test
  @Severity(SeverityLevel.NORMAL)
  @DisplayName("MR12 - isActive deve ser verdadeiro para estados REQUESTED e IN_PROGRESS")
  void mr12IsActiveDeveSerTrueParaRequestedEInProgress() {
    MaintenanceRecord requested = buildRecord();
    assertThat(requested.isActive()).isTrue();

    requested.start(1L);
    assertThat(requested.isActive()).isTrue();
  }

  @Test
  @Severity(SeverityLevel.NORMAL)
  @DisplayName("MR13 - isActive deve ser falso para estados COMPLETED e CANCELLED")
  void mr13IsActiveDeveSerFalseParaTerminados() {
    MaintenanceRecord completed = buildRecord();
    completed.start(1L);
    completed.complete(1L, "ok", BigDecimal.ZERO);
    assertThat(completed.isActive()).isFalse();

    MaintenanceRecord cancelled = buildRecord();
    cancelled.cancel();
    assertThat(cancelled.isActive()).isFalse();
  }
}
