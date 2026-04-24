package com.portfolio.assetmanagement.unit.domain.transfer;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.portfolio.assetmanagement.domain.asset.entity.Asset;
import com.portfolio.assetmanagement.domain.transfer.entity.TransferRequest;
import com.portfolio.assetmanagement.domain.transfer.enums.TransferStatus;
import com.portfolio.assetmanagement.domain.unit.entity.Unit;
import com.portfolio.assetmanagement.domain.user.entity.User;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import io.qameta.allure.Severity;
import io.qameta.allure.SeverityLevel;
import io.qameta.allure.Story;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Tag;

@Epic("Backend")
@Feature("Domínio — Transfer")
@Story("Construção")
@DisplayName("TransferRequest — Construtor")
@Tag("testType=Unit")
@Tag("module=Domain")
class TransferRequestConstructorTest {

  @Test
  @Severity(SeverityLevel.CRITICAL)
  @DisplayName("TT01 - Construtor inicia transferência como PENDING com requestedAt preenchido")
  void tt01ConstrutorIniciaTransferenciaComoPending() {
    TransferRequest transfer =
        new TransferRequest(buildAsset(), buildUnit(10L), buildUnit(20L), buildUser(), "Motivo válido");

    assertThat(transfer.getStatus()).isEqualTo(TransferStatus.PENDING);
    assertThat(transfer.getRequestedAt()).isNotNull();
    assertThat(transfer.getApprovedAt()).isNull();
    assertThat(transfer.getCompletedAt()).isNull();
  }

  @Test
  @Severity(SeverityLevel.NORMAL)
  @DisplayName("TT02 - Construtor falha quando asset é nulo")
  void tt02ConstrutorFalhaQuandoAssetENulo() {
    assertThatThrownBy(() -> new TransferRequest(null, buildUnit(10L), buildUnit(20L), buildUser(), "Motivo"))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessageContaining("asset é obrigatório");
  }

  @Test
  @Severity(SeverityLevel.NORMAL)
  @DisplayName("TT03 - Construtor falha quando reason é blank")
  void tt03ConstrutorFalhaQuandoReasonEBlank() {
    assertThatThrownBy(
            () -> new TransferRequest(buildAsset(), buildUnit(10L), buildUnit(20L), buildUser(), "   "))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessageContaining("reason é obrigatório");
  }

  @Test
  @Severity(SeverityLevel.NORMAL)
  @DisplayName("TT04 - Construtor falha para transferência na mesma unidade")
  void tt04ConstrutorFalhaParaTransferenciaNaMesmaUnidade() {
    Unit unit = buildUnit(10L);

    assertThatThrownBy(() -> new TransferRequest(buildAsset(), unit, unit, buildUser(), "Motivo"))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessageContaining("mesma unidade");
  }

  private Asset buildAsset() {
    return mock(Asset.class);
  }

  private Unit buildUnit(Long id) {
    Unit unit = mock(Unit.class);
    when(unit.getId()).thenReturn(id);
    return unit;
  }

  private User buildUser() {
    return mock(User.class);
  }
}
