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
import java.math.BigDecimal;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@Epic("Backend")
@Feature("Domínio — Manutenção")
@Story("Execução de manutenção")
@DisplayName("MaintenanceRecord — Concluir")
@Tag("testType=Unit")
@Tag("module=Domain")
class MaintenanceRecordCompleteTest {

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

  private MaintenanceRecord recordEmProgresso() {
    MaintenanceRecord record = buildRecord();
    record.start(42L);
    return record;
  }

  @Test
  @Severity(SeverityLevel.CRITICAL)
  @DisplayName("MR08 - Deve concluir manutenção corretamente")
  void mr08DeveConcluirCorretamente() {
    MaintenanceRecord record = recordEmProgresso();

    record.complete(42L, "Troca da bateria realizada", BigDecimal.valueOf(150));

    assertThat(record.getStatus()).isEqualTo(MaintenanceStatus.COMPLETED);
    assertThat(record.getCompletedByUserId()).isEqualTo(42L);
    assertThat(record.getCompletedAt()).isNotNull();
    assertThat(record.getResolution()).isEqualTo("Troca da bateria realizada");
  }

  @Test
  @Severity(SeverityLevel.CRITICAL)
  @DisplayName("MR09 - Deve falhar ao concluir fora do estado IN_PROGRESS")
  void mr09DeveLancarQuandoStatusNaoEhInProgress() {
    MaintenanceRecord record = buildRecord();

    assertThatThrownBy(() -> record.complete(42L, "resolução", BigDecimal.ZERO))
        .isInstanceOf(BusinessException.class)
        .hasMessageContaining("Somente manutenção IN_PROGRESS pode ser concluída");
  }
}
