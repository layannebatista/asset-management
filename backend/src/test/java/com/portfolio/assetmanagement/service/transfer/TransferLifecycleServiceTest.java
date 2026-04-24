package com.portfolio.assetmanagement.service.transfer;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
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
import com.portfolio.assetmanagement.infrastructure.persistence.transfer.repository.TransferRepository;
import com.portfolio.assetmanagement.security.context.LoggedUserContext;
import com.portfolio.assetmanagement.shared.exception.BusinessException;
import com.portfolio.assetmanagement.shared.exception.ForbiddenException;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import io.qameta.allure.Severity;
import io.qameta.allure.SeverityLevel;
import io.qameta.allure.Story;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.Tag;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@Epic("Backend")
@Feature("Serviços — Transfer")
@Story("Conclusão e cancelamento")
@DisplayName("TransferService — Conclusão e Cancelamento")
@Tag("testType=Integration")
@Tag("module=Transfer")
class TransferLifecycleServiceTest {

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
  @Severity(SeverityLevel.BLOCKER)
  @DisplayName("TS08 - Conclui transferência aprovada e move ativo para unidade destino")
  void ts08ConcluiTransferenciaAprovadaEMoveAtivoParaUnidadeDestino() {
    TransferRequest transfer = buildTransfer(TransferStatus.APPROVED, true);
    Asset asset = transfer.getAsset();
    when(repository.findById(55L)).thenReturn(Optional.of(transfer));
    when(loggedUser.isAdmin()).thenReturn(true);
    when(loggedUser.getUserId()).thenReturn(99L);

    service.complete(55L);

    verify(validationService).validateCanComplete(transfer);
    verify(asset).completeTransfer(transfer.getToUnit());
    verify(transfer).complete();
    verify(repository).save(transfer);
    verify(auditService)
        .registerEvent(
            eq(AuditEventType.TRANSFER_COMPLETED), eq(99L), eq(1L), eq(20L), eq(55L), eq("Transferência concluída"));
  }

  @Test
  @Severity(SeverityLevel.NORMAL)
  @DisplayName("TS09 - Cancela transferência pendente e devolve ativo para AVAILABLE")
  void ts09CancelaTransferenciaPendenteEDevolveAtivoParaAvailable() {
    TransferRequest transfer = buildTransfer(TransferStatus.PENDING, true);
    Asset asset = transfer.getAsset();
    when(repository.findById(55L)).thenReturn(Optional.of(transfer));
    when(loggedUser.isAdmin()).thenReturn(true);
    when(loggedUser.getUserId()).thenReturn(99L);

    service.cancel(55L);

    verify(validationService).validateCanCancel(transfer);
    verify(transfer).cancel();
    verify(asset).changeStatus(AssetStatus.AVAILABLE);
    verify(repository).save(transfer);
  }

  @Test
  @Severity(SeverityLevel.CRITICAL)
  @DisplayName("TS10 - OPERADOR sem atribuição não pode concluir transferência")
  void ts10OperadorSemAtribuicaoNaoPodeConcluirTransferencia() {
    TransferRequest transfer = buildTransfer(TransferStatus.APPROVED, false);
    when(repository.findById(55L)).thenReturn(Optional.of(transfer));
    when(loggedUser.isAdmin()).thenReturn(false);
    when(loggedUser.isManager()).thenReturn(false);
    when(loggedUser.getUserId()).thenReturn(99L);

    assertThatThrownBy(() -> service.complete(55L))
        .isInstanceOf(ForbiddenException.class)
      .hasMessageContaining("Acesso negado à transferência");
  }

  @Test
  @Severity(SeverityLevel.NORMAL)
  @DisplayName("TS11 - Cancelação inválida propaga BusinessException")
  void ts11CancelamentoInvalidoPropagaBusinessException() {
    TransferRequest transfer = buildTransfer(TransferStatus.APPROVED, true);
    when(repository.findById(55L)).thenReturn(Optional.of(transfer));
    when(loggedUser.isAdmin()).thenReturn(true);
    org.mockito.Mockito.doThrow(new BusinessException("Apenas transferências pendentes podem ser canceladas"))
        .when(validationService)
        .validateCanCancel(transfer);

    assertThatThrownBy(() -> service.cancel(55L))
        .isInstanceOf(BusinessException.class)
        .hasMessageContaining("pendentes");
  }

  private TransferRequest buildTransfer(TransferStatus status, boolean assignedToRequester) {
    Organization org = mock(Organization.class);
    when(org.getId()).thenReturn(1L);

    Unit fromUnit = mock(Unit.class);
    when(fromUnit.getId()).thenReturn(10L);

    Unit toUnit = mock(Unit.class);
    when(toUnit.getId()).thenReturn(20L);

    com.portfolio.assetmanagement.domain.user.entity.User assignedUser = mock(com.portfolio.assetmanagement.domain.user.entity.User.class);
    when(assignedUser.getId()).thenReturn(10L);

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

