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
import java.math.BigDecimal;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

@DisplayName("MaintenanceRecord — regras de negócio da entidade")
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
  class ConstrucaoTest {

    @Test
    @DisplayName("deve criar registro com status REQUESTED e createdAt preenchido")
    void deveCriarComStatusRequestedECreatedAt() {
      MaintenanceRecord record = buildRecord();

      assertThat(record.getStatus()).isEqualTo(MaintenanceStatus.REQUESTED);
      assertThat(record.getCreatedAt()).isNotNull();
      assertThat(record.getStartedAt()).isNull();
      assertThat(record.getCompletedAt()).isNull();
    }

    @Test
    @DisplayName("deve lançar IllegalArgumentException quando asset é null")
    void deveLancarQuandoAssetNull() {
      assertThatThrownBy(() -> new MaintenanceRecord(null, 1L, 10L, 99L, "Descrição válida aqui"))
          .isInstanceOf(IllegalArgumentException.class)
          .hasMessageContaining("asset é obrigatório");
    }

    @Test
    @DisplayName("deve lançar IllegalArgumentException quando description é blank")
    void deveLancarQuandoDescricaoBlank() {
      Asset asset = buildAsset(1L, 10L);

      assertThatThrownBy(() -> new MaintenanceRecord(asset, 1L, 10L, 99L, "   "))
          .isInstanceOf(IllegalArgumentException.class)
          .hasMessageContaining("description é obrigatório");
    }

    @Test
    @DisplayName("deve lançar BusinessException quando asset pertence a outra organização")
    void deveLancarQuandoAssetDeOutraOrg() {
      Asset asset = buildAsset(2L, 10L);

      assertThatThrownBy(() -> new MaintenanceRecord(asset, 1L, 10L, 99L, "Descrição válida aqui"))
          .isInstanceOf(BusinessException.class)
          .hasMessageContaining("Asset não pertence à organization");
    }

    @Test
    @DisplayName("deve lançar BusinessException quando asset pertence a outra unidade")
    void deveLancarQuandoAssetDeOutraUnit() {
      Asset asset = buildAsset(1L, 20L);

      assertThatThrownBy(() -> new MaintenanceRecord(asset, 1L, 10L, 99L, "Descrição válida aqui"))
          .isInstanceOf(BusinessException.class)
          .hasMessageContaining("Asset não pertence à unit");
    }
  }

  @Nested
  @DisplayName("start()")
  class StartTest {

    @Test
    @DisplayName("deve transitar para IN_PROGRESS e preencher startedAt e startedByUserId")
    void deveIniciarCorretamente() {
      MaintenanceRecord record = buildRecord();

      record.start(42L);

      assertThat(record.getStatus()).isEqualTo(MaintenanceStatus.IN_PROGRESS);
      assertThat(record.getStartedByUserId()).isEqualTo(42L);
      assertThat(record.getStartedAt()).isNotNull();
    }

    @Test
    @DisplayName("deve lançar BusinessException quando status não é REQUESTED")
    void deveLancarQuandoStatusNaoEhRequested() {
      MaintenanceRecord record = buildRecord();
      record.start(42L);

      assertThatThrownBy(() -> record.start(42L))
          .isInstanceOf(BusinessException.class)
          .hasMessageContaining("Somente manutenção REQUESTED pode ser iniciada");
    }

    @Test
    @DisplayName("deve lançar IllegalArgumentException quando userId é null")
    void deveLancarQuandoUserIdNull() {
      MaintenanceRecord record = buildRecord();

      assertThatThrownBy(() -> record.start(null))
          .isInstanceOf(IllegalArgumentException.class)
          .hasMessageContaining("userId é obrigatório");
    }
  }

  @Nested
  @DisplayName("complete()")
  class CompleteTest {

    private MaintenanceRecord recordEmProgresso() {
      MaintenanceRecord record = buildRecord();
      record.start(42L);
      return record;
    }

    @Test
    @DisplayName("deve transitar para COMPLETED e preencher todos os campos")
    void deveConcluirCorretamente() {
      MaintenanceRecord record = recordEmProgresso();

      record.complete(42L, "Troca da bateria realizada", BigDecimal.valueOf(150));

      assertThat(record.getStatus()).isEqualTo(MaintenanceStatus.COMPLETED);
      assertThat(record.getCompletedByUserId()).isEqualTo(42L);
      assertThat(record.getCompletedAt()).isNotNull();
      assertThat(record.getResolution()).isEqualTo("Troca da bateria realizada");
    }

    @Test
    @DisplayName("deve lançar BusinessException quando status não é IN_PROGRESS")
    void deveLancarQuandoStatusNaoEhInProgress() {
      MaintenanceRecord record = buildRecord();

      assertThatThrownBy(() -> record.complete(42L, "resolução", BigDecimal.ZERO))
          .isInstanceOf(BusinessException.class)
          .hasMessageContaining("Somente manutenção IN_PROGRESS pode ser concluída");
    }

    @Test
    @DisplayName("deve lançar IllegalArgumentException quando resolution é blank")
    void deveLancarQuandoResolutionBlank() {
      MaintenanceRecord record = recordEmProgresso();

      assertThatThrownBy(() -> record.complete(42L, "  ", BigDecimal.ZERO))
          .isInstanceOf(IllegalArgumentException.class)
          .hasMessageContaining("resolution é obrigatório");
    }

    @Test
    @DisplayName("deve lançar IllegalArgumentException quando userId é null")
    void deveLancarQuandoUserIdNull() {
      MaintenanceRecord record = recordEmProgresso();

      assertThatThrownBy(() -> record.complete(null, "resolução válida", BigDecimal.ZERO))
          .isInstanceOf(IllegalArgumentException.class)
          .hasMessageContaining("userId é obrigatório");
    }
  }

  @Nested
  @DisplayName("cancel()")
  class CancelTest {

    @Test
    @DisplayName("deve cancelar manutenção REQUESTED")
    void deveCancelarRequestedCorretamente() {
      MaintenanceRecord record = buildRecord();

      record.cancel();

      assertThat(record.getStatus()).isEqualTo(MaintenanceStatus.CANCELLED);
    }

    @Test
    @DisplayName("deve cancelar manutenção IN_PROGRESS")
    void deveCancelarInProgressCorretamente() {
      MaintenanceRecord record = buildRecord();
      record.start(42L);

      record.cancel();

      assertThat(record.getStatus()).isEqualTo(MaintenanceStatus.CANCELLED);
    }

    @Test
    @DisplayName("deve lançar BusinessException ao cancelar manutenção COMPLETED")
    void deveLancarQuandoConcluida() {
      MaintenanceRecord record = buildRecord();
      record.start(42L);
      record.complete(42L, "resolução válida", BigDecimal.ZERO);

      assertThatThrownBy(record::cancel)
          .isInstanceOf(BusinessException.class)
          .hasMessageContaining("Manutenção concluída não pode ser cancelada");
    }

    @Test
    @DisplayName("deve lançar BusinessException ao cancelar manutenção já CANCELLED")
    void deveLancarQuandoJaCancelada() {
      MaintenanceRecord record = buildRecord();
      record.cancel();

      assertThatThrownBy(record::cancel)
          .isInstanceOf(BusinessException.class)
          .hasMessageContaining("Manutenção já cancelada");
    }
  }

  @Nested
  @DisplayName("Helpers de estado")
  class HelpersTest {

    @Test
    @DisplayName("isActive() deve ser true para REQUESTED e IN_PROGRESS")
    void isActiveDeveSerTrueParaRequestedEInProgress() {
      MaintenanceRecord requested = buildRecord();
      assertThat(requested.isActive()).isTrue();

      requested.start(1L);
      assertThat(requested.isActive()).isTrue();
    }

    @Test
    @DisplayName("isActive() deve ser false para COMPLETED e CANCELLED")
    void isActiveDeveSerFalseParaTerminados() {
      MaintenanceRecord completed = buildRecord();
      completed.start(1L);
      completed.complete(1L, "ok", BigDecimal.ZERO);
      assertThat(completed.isActive()).isFalse();

      MaintenanceRecord cancelled = buildRecord();
      cancelled.cancel();
      assertThat(cancelled.isActive()).isFalse();
    }

    @Test
    @DisplayName("isCompleted() deve ser true apenas para COMPLETED")
    void isCompletedDeveSerTrueApenasParaCompleted() {
      MaintenanceRecord record = buildRecord();
      assertThat(record.isCompleted()).isFalse();

      record.start(1L);
      assertThat(record.isCompleted()).isFalse();

      record.complete(1L, "ok", BigDecimal.ZERO);
      assertThat(record.isCompleted()).isTrue();
    }
  }
}
