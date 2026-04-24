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
@Story("Aprovação e rejeição")
@DisplayName("TransferRequest — Decisão")
@Tag("testType=Unit")
@Tag("module=Domain")
class TransferRequestDecisionTest {

  @Test
  @Severity(SeverityLevel.CRITICAL)
  @DisplayName("TT05 - Approve muda status para APPROVED e registra approvedAt")
  void tt05ApproveMudaStatusParaApproved() {
    TransferRequest transfer = buildTransfer();
    User approver = buildUser();

    transfer.approve(approver);

    assertThat(transfer.getStatus()).isEqualTo(TransferStatus.APPROVED);
    assertThat(transfer.getApprovedBy()).isEqualTo(approver);
    assertThat(transfer.getApprovedAt()).isNotNull();
  }

  @Test
  @Severity(SeverityLevel.NORMAL)
  @DisplayName("TT06 - Reject muda status para REJECTED")
  void tt06RejectMudaStatusParaRejected() {
    TransferRequest transfer = buildTransfer();
    User approver = buildUser();

    transfer.reject(approver);

    assertThat(transfer.getStatus()).isEqualTo(TransferStatus.REJECTED);
    assertThat(transfer.getApprovedBy()).isEqualTo(approver);
    assertThat(transfer.getApprovedAt()).isNotNull();
  }

  @Test
  @Severity(SeverityLevel.NORMAL)
  @DisplayName("TT07 - Approve falha fora do estado PENDING")
  void tt07ApproveFalhaForaDoEstadoPending() {
    TransferRequest transfer = buildTransfer();
    transfer.reject(buildUser());

    assertThatThrownBy(() -> transfer.approve(buildUser()))
        .isInstanceOf(IllegalStateException.class)
        .hasMessageContaining("PENDING");
  }

  @Test
  @Severity(SeverityLevel.NORMAL)
  @DisplayName("TT08 - Reject falha quando approver é nulo")
  void tt08RejectFalhaQuandoApproverENulo() {
    TransferRequest transfer = buildTransfer();

    assertThatThrownBy(() -> transfer.reject(null))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessageContaining("approver é obrigatório");
  }

  private TransferRequest buildTransfer() {
    return new TransferRequest(buildAsset(), buildUnit(10L), buildUnit(20L), buildUser(), "Motivo válido");
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
