package com.portfolio.assetmanagement.service.transfer;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.portfolio.assetmanagement.application.asset.service.AssetService;
import com.portfolio.assetmanagement.application.audit.service.AuditService;
import com.portfolio.assetmanagement.application.transfer.service.TransferConcurrencyService;
import com.portfolio.assetmanagement.application.transfer.service.TransferService;
import com.portfolio.assetmanagement.application.transfer.service.TransferValidationService;
import com.portfolio.assetmanagement.application.unit.service.UnitService;
import com.portfolio.assetmanagement.domain.asset.entity.Asset;
import com.portfolio.assetmanagement.domain.asset.enums.AssetStatus;
import com.portfolio.assetmanagement.domain.audit.enums.AuditEventType;
import com.portfolio.assetmanagement.domain.organization.entity.Organization;
import com.portfolio.assetmanagement.domain.transfer.entity.TransferRequest;
import com.portfolio.assetmanagement.domain.transfer.enums.TransferStatus;
import com.portfolio.assetmanagement.domain.unit.entity.Unit;
import com.portfolio.assetmanagement.domain.user.entity.User;
import com.portfolio.assetmanagement.infrastructure.persistence.transfer.repository.TransferRepository;
import com.portfolio.assetmanagement.security.context.LoggedUserContext;
import com.portfolio.assetmanagement.shared.exception.ForbiddenException;
import com.portfolio.assetmanagement.shared.exception.NotFoundException;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import io.qameta.allure.Severity;
import io.qameta.allure.SeverityLevel;
import io.qameta.allure.Story;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@Epic("Backend")
@Feature("Serviços — Transfer")
@Story("Aprovação e rejeição")
@DisplayName("TransferService — Decisão")
@Tag("testType=Integration")
@Tag("module=Transfer")
class TransferDecisionServiceTest {

  @Mock private TransferRepository repository;
  @Mock private AssetService assetService;
  @Mock private UnitService unitService;
  @Mock private LoggedUserContext loggedUser;
  @Mock private TransferValidationService validationService;
  @Mock private TransferConcurrencyService concurrencyService;
  @Mock private AuditService auditService;

  private TransferService service;

  @BeforeEach
  void setup() {
    service =
        new TransferService(
            repository,
            assetService,
            unitService,
            loggedUser,
            validationService,
            concurrencyService,
            auditService);

    doAnswer(
            invocation -> {
              Runnable runnable = invocation.getArgument(1);
              runnable.run();
              return null;
            })
        .when(concurrencyService)
        .executeWithAssetLock(any(), any());
  }

  @Test
  @Severity(SeverityLevel.CRITICAL)
  @DisplayName("TS04 - Aprova transferência pendente com lock, save e audit")
  void ts04AprovaTransferenciaPendente() {
    TransferRequest transfer = buildTransfer(TransferStatus.PENDING, 10L, 20L, 1L, true);
    User approver = mock(User.class);
    when(repository.findById(55L)).thenReturn(Optional.of(transfer));
    when(loggedUser.isAdmin()).thenReturn(true);
    when(loggedUser.getUser()).thenReturn(approver);
    when(loggedUser.getUserId()).thenReturn(99L);

    service.approve(55L, "Aprovada");

    verify(validationService).validateCanApprove(transfer);
    verify(concurrencyService).executeWithAssetLock(eq(100L), any());
    verify(transfer).approve(approver);
    verify(repository).save(transfer);
    verify(auditService)
        .registerEvent(
            eq(AuditEventType.TRANSFER_APPROVED), eq(99L), eq(1L), eq(10L), eq(55L), eq("Transferência aprovada"));
  }

  @Test
  @Severity(SeverityLevel.NORMAL)
  @DisplayName("TS05 - Rejeita transferência pendente e devolve ativo para AVAILABLE")
  void ts05RejeitaTransferenciaPendenteEDevolveAtivoParaAvailable() {
    TransferRequest transfer = buildTransfer(TransferStatus.PENDING, 10L, 20L, 1L, true);
    User approver = mock(User.class);
    Asset asset = transfer.getAsset();
    when(repository.findById(55L)).thenReturn(Optional.of(transfer));
    when(loggedUser.isAdmin()).thenReturn(true);
    when(loggedUser.getUser()).thenReturn(approver);
    when(loggedUser.getUserId()).thenReturn(99L);

    service.reject(55L, "Rejeitada");

    verify(validationService).validateCanReject(transfer);
    verify(transfer).reject(approver);
    verify(asset).changeStatus(AssetStatus.AVAILABLE);
    verify(repository).save(transfer);
  }

  @Test
  @Severity(SeverityLevel.CRITICAL)
  @DisplayName("TS06 - GESTOR fora do escopo não pode aprovar transferência")
  void ts06GestorForaDoEscopoNaoPodeAprovarTransferencia() {
    TransferRequest transfer = buildTransfer(TransferStatus.PENDING, 10L, 20L, 1L, true);
    when(repository.findById(55L)).thenReturn(Optional.of(transfer));
    when(loggedUser.isAdmin()).thenReturn(false);
    when(loggedUser.isManager()).thenReturn(true);
    when(loggedUser.getUnitId()).thenReturn(99L);

    assertThatThrownBy(() -> service.approve(55L, "Sem acesso"))
        .isInstanceOf(ForbiddenException.class)
         .hasMessageContaining("Acesso negado à transferência");

    verify(repository, never()).save(any());
  }

  @Test
  @Severity(SeverityLevel.NORMAL)
  @DisplayName("TS07 - Rejeitar transferência inexistente lança NotFoundException")
  void ts07RejeitarTransferenciaInexistenteLancaNotFound() {
    when(repository.findById(999L)).thenReturn(Optional.empty());
    when(loggedUser.isAdmin()).thenReturn(true);

    assertThatThrownBy(() -> service.reject(999L, "Não existe"))
        .isInstanceOf(NotFoundException.class)
        .hasMessageContaining("Transferência não encontrada");
  }

  private TransferRequest buildTransfer(
      TransferStatus status, Long fromUnitId, Long toUnitId, Long orgId, boolean assignedToRequester) {
    Organization org = mock(Organization.class);
    when(org.getId()).thenReturn(orgId);

    Unit fromUnit = mock(Unit.class);
    when(fromUnit.getId()).thenReturn(fromUnitId);

    Unit toUnit = mock(Unit.class);
    when(toUnit.getId()).thenReturn(toUnitId);

    User assignedUser = mock(User.class);
    when(assignedUser.getId()).thenReturn(99L);

    Asset asset = mock(Asset.class);
    when(asset.getId()).thenReturn(100L);
    when(asset.getOrganization()).thenReturn(org);
    when(asset.getUnit()).thenReturn(fromUnit);
    when(asset.getAssignedUser()).thenReturn(assignedToRequester ? assignedUser : null);

    TransferRequest transfer = mock(TransferRequest.class);
    when(transfer.getId()).thenReturn(55L);
    when(transfer.getStatus()).thenReturn(status);
    when(transfer.getAsset()).thenReturn(asset);
    when(transfer.getFromUnit()).thenReturn(fromUnit);
    when(transfer.getToUnit()).thenReturn(toUnit);
    return transfer;
  }
}

