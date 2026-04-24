package com.portfolio.assetmanagement.service.transfer;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
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
import com.portfolio.assetmanagement.domain.unit.entity.Unit;
import com.portfolio.assetmanagement.domain.user.entity.User;
import com.portfolio.assetmanagement.infrastructure.persistence.transfer.repository.TransferRepository;
import com.portfolio.assetmanagement.security.context.LoggedUserContext;
import com.portfolio.assetmanagement.shared.exception.BusinessException;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import io.qameta.allure.Severity;
import io.qameta.allure.SeverityLevel;
import io.qameta.allure.Story;
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
@Story("Solicitação")
@DisplayName("TransferService — Solicitação")
@Tag("testType=Integration")
@Tag("module=Transfer")
class TransferRequestServiceTest {

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
  }

  @Test
  @Severity(SeverityLevel.CRITICAL)
  @DisplayName("TS01 - Solicita transferência com sucesso e muda ativo para IN_TRANSFER")
  void ts01SolicitaTransferenciaComSucesso() {
    Asset asset = buildAsset(1L, 10L, AssetStatus.AVAILABLE);
    Unit destino = buildUnit(20L, 1L, "Filial");
    User requester = mock(User.class);
    Organization org = asset.getOrganization();
    Unit origem = asset.getUnit();

    when(loggedUser.getOrganizationId()).thenReturn(1L);
    when(loggedUser.getUser()).thenReturn(requester);
    when(loggedUser.getUserId()).thenReturn(99L);
    when(assetService.findById(100L)).thenReturn(asset);
    when(unitService.findById(20L)).thenReturn(destino);
    when(repository.save(any(TransferRequest.class))).thenAnswer(invocation -> invocation.getArgument(0));

    service.request(100L, 20L, "Mudança operacional");

    verify(validationService).requireAssetExists(asset);
    verify(validationService).validateOwnership(asset, 1L);
    verify(validationService).validateAssetAvailableForTransfer(asset);
    verify(validationService).validateTargetUnit(origem, destino);
    verify(validationService).validateNoActiveTransfer(asset);
    verify(asset).changeStatus(AssetStatus.IN_TRANSFER);
    verify(repository).save(any(TransferRequest.class));
    verify(auditService).registerEvent(
      AuditEventType.TRANSFER_REQUESTED,
      99L,
      org.getId(),
      origem.getId(),
      null,
      "Transferência solicitada para unidade Filial");
  }

  @Test
  @Severity(SeverityLevel.NORMAL)
  @DisplayName("TS02 - Ativo sem unidade associada não pode ser transferido")
  void ts02AtivoSemUnidadeAssociadaNaoPodeSerTransferido() {
    Asset asset = buildAsset(1L, null, AssetStatus.AVAILABLE);
    when(assetService.findById(100L)).thenReturn(asset);
    when(loggedUser.getOrganizationId()).thenReturn(1L);

    assertThatThrownBy(() -> service.request(100L, 20L, "Sem unidade"))
        .isInstanceOf(BusinessException.class)
        .hasMessageContaining("Ativo não possui unidade associada");
  }

  @Test
  @Severity(SeverityLevel.NORMAL)
  @DisplayName("TS03 - Propaga falha de validação quando já existe transferência ativa")
  void ts03PropagaFalhaQuandoJaExisteTransferenciaAtiva() {
    Asset asset = buildAsset(1L, 10L, AssetStatus.AVAILABLE);
    Unit destino = buildUnit(20L, 1L, "Filial");

    when(assetService.findById(100L)).thenReturn(asset);
    when(unitService.findById(20L)).thenReturn(destino);
    when(loggedUser.getOrganizationId()).thenReturn(1L);
    org.mockito.Mockito.doThrow(new BusinessException("Já existe transferência ativa para este ativo"))
        .when(validationService)
        .validateNoActiveTransfer(asset);

    assertThatThrownBy(() -> service.request(100L, 20L, "Duplicada"))
        .isInstanceOf(BusinessException.class)
        .hasMessageContaining("Já existe transferência ativa");
  }

  private Asset buildAsset(Long orgId, Long unitId, AssetStatus status) {
    Organization org = mock(Organization.class);
    when(org.getId()).thenReturn(orgId);

    Unit unit = unitId == null ? null : buildUnit(unitId, orgId, "Origem");

    Asset asset = mock(Asset.class);
    when(asset.getId()).thenReturn(100L);
    when(asset.getOrganization()).thenReturn(org);
    when(asset.getUnit()).thenReturn(unit);
    when(asset.getStatus()).thenReturn(status);
    return asset;
  }

  private Unit buildUnit(Long unitId, Long orgId, String name) {
    Organization org = mock(Organization.class);
    when(org.getId()).thenReturn(orgId);
    Unit unit = mock(Unit.class);
    when(unit.getId()).thenReturn(unitId);
    when(unit.getName()).thenReturn(name);
    when(unit.getOrganization()).thenReturn(org);
    return unit;
  }
}

