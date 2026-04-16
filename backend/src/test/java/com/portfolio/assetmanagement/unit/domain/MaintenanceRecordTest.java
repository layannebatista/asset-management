package com.portfolio.assetmanagement.unit.domain;

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
import io.qameta.allure.Story;
import io.qameta.allure.Severity;
import io.qameta.allure.SeverityLevel;
import java.math.BigDecimal;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

@Epic("Backend")
@Feature("Domínio — Manutenção")
@DisplayName("Entidade MaintenanceRecord")
class MaintenanceRecordTest {

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

@Nested
@DisplayName("Construtor")
@Story("Criação de manutenção")
class ConstrucaoTest {

@Test
@Severity(SeverityLevel.CRITICAL)
@DisplayName("Deve iniciar como REQUESTED com datas corretas")
void deveCriarComStatusRequestedECreatedAt() {
  MaintenanceRecord record = buildRecord();

  assertThat(record.getStatus()).isEqualTo(MaintenanceStatus.REQUESTED);
  assertThat(record.getCreatedAt()).isNotNull();
  assertThat(record.getStartedAt()).isNull();
  assertThat(record.getCompletedAt()).isNull();
}

@Test
@Severity(SeverityLevel.CRITICAL)
@DisplayName("Deve falhar quando asset é null")
void deveLancarQuandoAssetNull() {
  assertThatThrownBy(() -> new MaintenanceRecord(null, 1L, 10L, 99L, "Descrição válida aqui"))
      .isInstanceOf(IllegalArgumentException.class)
      .hasMessageContaining("asset é obrigatório");
}

@Test
@Severity(SeverityLevel.NORMAL)
@DisplayName("Deve falhar quando descrição é inválida")
void deveLancarQuandoDescricaoBlank() {
  Asset asset = buildAsset(1L, 10L);

  assertThatThrownBy(() -> new MaintenanceRecord(asset, 1L, 10L, 99L, "   "))
      .isInstanceOf(IllegalArgumentException.class)
      .hasMessageContaining("description é obrigatório");
}

@Test
@Severity(SeverityLevel.CRITICAL)
@DisplayName("Deve falhar quando asset pertence a outra organização")
void deveLancarQuandoAssetDeOutraOrg() {
  Asset asset = buildAsset(2L, 10L);

  assertThatThrownBy(() -> new MaintenanceRecord(asset, 1L, 10L, 99L, "Descrição válida aqui"))
      .isInstanceOf(BusinessException.class)
      .hasMessageContaining("Asset não pertence à organization");
}

@Test
@Severity(SeverityLevel.CRITICAL)
@DisplayName("Deve falhar quando asset pertence a outra unidade")
void deveLancarQuandoAssetDeOutraUnit() {
  Asset asset = buildAsset(1L, 20L);

  assertThatThrownBy(() -> new MaintenanceRecord(asset, 1L, 10L, 99L, "Descrição válida aqui"))
      .isInstanceOf(BusinessException.class)
      .hasMessageContaining("Asset não pertence à unit");
}

}

@Nested
@DisplayName("Início de manutenção")
@Story("Execução de manutenção")
class StartTest {

@Test
@Severity(SeverityLevel.CRITICAL)
@DisplayName("Deve iniciar manutenção corretamente")
void deveIniciarCorretamente() {
  MaintenanceRecord record = buildRecord();

  record.start(42L);

  assertThat(record.getStatus()).isEqualTo(MaintenanceStatus.IN_PROGRESS);
  assertThat(record.getStartedByUserId()).isEqualTo(42L);
  assertThat(record.getStartedAt()).isNotNull();
}

@Test
@Severity(SeverityLevel.CRITICAL)
@DisplayName("Deve falhar ao iniciar fora do estado REQUESTED")
void deveLancarQuandoStatusNaoEhRequested() {
  MaintenanceRecord record = buildRecord();
  record.start(42L);

  assertThatThrownBy(() -> record.start(42L))
      .isInstanceOf(BusinessException.class)
      .hasMessageContaining("Somente manutenção REQUESTED pode ser iniciada");
}

@Test
@Severity(SeverityLevel.NORMAL)
@DisplayName("Deve falhar quando userId é null")
void deveLancarQuandoUserIdNull() {
  MaintenanceRecord record = buildRecord();

  assertThatThrownBy(() -> record.start(null))
      .isInstanceOf(IllegalArgumentException.class)
      .hasMessageContaining("userId é obrigatório");
}

}

@Nested
@DisplayName("Conclusão de manutenção")
@Story("Execução de manutenção")
class CompleteTest {

private MaintenanceRecord recordEmProgresso() {
  MaintenanceRecord record = buildRecord();
  record.start(42L);
  return record;
}

@Test
@Severity(SeverityLevel.CRITICAL)
@DisplayName("Deve concluir manutenção corretamente")
void deveConcluirCorretamente() {
  MaintenanceRecord record = recordEmProgresso();

  record.complete(42L, "Troca da bateria realizada", BigDecimal.valueOf(150));

  assertThat(record.getStatus()).isEqualTo(MaintenanceStatus.COMPLETED);
  assertThat(record.getCompletedByUserId()).isEqualTo(42L);
  assertThat(record.getCompletedAt()).isNotNull();
  assertThat(record.getResolution()).isEqualTo("Troca da bateria realizada");
}

@Test
@Severity(SeverityLevel.CRITICAL)
@DisplayName("Deve falhar ao concluir fora do estado IN_PROGRESS")
void deveLancarQuandoStatusNaoEhInProgress() {
  MaintenanceRecord record = buildRecord();

  assertThatThrownBy(() -> record.complete(42L, "resolução", BigDecimal.ZERO))
      .isInstanceOf(BusinessException.class)
      .hasMessageContaining("Somente manutenção IN_PROGRESS pode ser concluída");
}

}

@Nested
@DisplayName("Cancelamento")
@Story("Execução de manutenção")
class CancelTest {

@Test
@Severity(SeverityLevel.NORMAL)
@DisplayName("Deve cancelar manutenção REQUESTED")
void deveCancelarRequestedCorretamente() {
  MaintenanceRecord record = buildRecord();
  record.cancel();

  assertThat(record.getStatus()).isEqualTo(MaintenanceStatus.CANCELLED);
}

@Test
@Severity(SeverityLevel.NORMAL)
@DisplayName("Deve cancelar manutenção IN_PROGRESS")
void deveCancelarInProgressCorretamente() {
  MaintenanceRecord record = buildRecord();
  record.start(42L);
  record.cancel();

  assertThat(record.getStatus()).isEqualTo(MaintenanceStatus.CANCELLED);
}

}

@Nested
@DisplayName("Estados auxiliares")
@Story("Validação de estado")
class HelpersTest {

@Test
@DisplayName("isActive deve ser verdadeiro para estados ativos")
void isActiveDeveSerTrueParaRequestedEInProgress() {
  MaintenanceRecord requested = buildRecord();
  assertThat(requested.isActive()).isTrue();

  requested.start(1L);
  assertThat(requested.isActive()).isTrue();
}

@Test
@DisplayName("isActive deve ser falso para estados finais")
void isActiveDeveSerFalseParaTerminados() {
  MaintenanceRecord completed = buildRecord();
  completed.start(1L);
  completed.complete(1L, "ok", BigDecimal.ZERO);
  assertThat(completed.isActive()).isFalse();

  MaintenanceRecord cancelled = buildRecord();
  cancelled.cancel();
  assertThat(cancelled.isActive()).isFalse();
}

}
}
