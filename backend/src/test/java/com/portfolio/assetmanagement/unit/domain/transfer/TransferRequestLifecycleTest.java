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
import org.junit.jupiter.api.Test;

@Epic("Backend")
@Feature("Domínio — Transfer")
@Story("Conclusão e estados")
@DisplayName("TransferRequest — Lifecycle")
class TransferRequestLifecycleTest {

  @Test
  @Severity(SeverityLevel.BLOCKER)
  @DisplayName("TT09 - Complete muda status para COMPLETED e registra completedAt")
  void tt09CompleteMudaStatusParaCompleted() {
    TransferRequest transfer = buildApprovedTransfer();

    transfer.complete();

    assertThat(transfer.getStatus()).isEqualTo(TransferStatus.COMPLETED);
    assertThat(transfer.getCompletedAt()).isNotNull();
  }

  @Test
  @Severity(SeverityLevel.NORMAL)
  @DisplayName("TT10 - Cancel muda status para CANCELLED quando PENDING")
  void tt10CancelMudaStatusParaCancelledQuandoPending() {
    TransferRequest transfer = buildTransfer();

    transfer.cancel();

    assertThat(transfer.getStatus()).isEqualTo(TransferStatus.CANCELLED);
    assertThat(transfer.isCancelled()).isTrue();
  }

  @Test
  @Severity(SeverityLevel.NORMAL)
  @DisplayName("TT11 - Complete falha fora do estado APPROVED")
  void tt11CompleteFalhaForaDoEstadoApproved() {
    TransferRequest transfer = buildTransfer();

    assertThatThrownBy(transfer::complete)
        .isInstanceOf(IllegalStateException.class)
        .hasMessageContaining("APPROVED");
  }

  @Test
  @Severity(SeverityLevel.NORMAL)
  @DisplayName("TT12 - Cancel falha fora do estado PENDING")
  void tt12CancelFalhaForaDoEstadoPending() {
    TransferRequest transfer = buildApprovedTransfer();

    assertThatThrownBy(transfer::cancel)
        .isInstanceOf(IllegalStateException.class)
        .hasMessageContaining("PENDING");
  }

  @Test
  @Severity(SeverityLevel.NORMAL)
  @DisplayName("TT13 - Helpers de estado refletem o status atual")
  void tt13HelpersDeEstadoRefletemStatusAtual() {
    TransferRequest pending = buildTransfer();
    assertThat(pending.isPending()).isTrue();

    TransferRequest approved = buildTransfer();
    approved.approve(buildUser());
    assertThat(approved.isApproved()).isTrue();

    TransferRequest completed = buildApprovedTransfer();
    completed.complete();
    assertThat(completed.isCompleted()).isTrue();

    TransferRequest rejected = buildTransfer();
    rejected.reject(buildUser());
    assertThat(rejected.isRejected()).isTrue();
  }

  private TransferRequest buildTransfer() {
    return new TransferRequest(buildAsset(), buildUnit(10L), buildUnit(20L), buildUser(), "Motivo válido");
  }

  private TransferRequest buildApprovedTransfer() {
    TransferRequest transfer = buildTransfer();
    transfer.approve(buildUser());
    return transfer;
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
