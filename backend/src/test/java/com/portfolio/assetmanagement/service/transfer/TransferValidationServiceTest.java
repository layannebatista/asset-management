package com.portfolio.assetmanagement.service.transfer;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.portfolio.assetmanagement.application.transfer.service.TransferValidationService;
import com.portfolio.assetmanagement.domain.asset.entity.Asset;
import com.portfolio.assetmanagement.domain.asset.enums.AssetStatus;
import com.portfolio.assetmanagement.domain.transfer.enums.TransferStatus;
import com.portfolio.assetmanagement.domain.unit.entity.Unit;
import com.portfolio.assetmanagement.infrastructure.persistence.transfer.repository.TransferRepository;
import com.portfolio.assetmanagement.shared.exception.BusinessException;
import com.portfolio.assetmanagement.shared.exception.ForbiddenException;
import com.portfolio.assetmanagement.shared.exception.NotFoundException;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import io.qameta.allure.Severity;
import io.qameta.allure.SeverityLevel;
import io.qameta.allure.Story;
import java.util.List;
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
@Story("Validação")
@DisplayName("TransferValidationService")
@Tag("testType=Integration")
@Tag("module=Transfer")
class TransferValidationServiceTest {

  @Mock private TransferRepository transferRepository;

  @Test
  @Severity(SeverityLevel.NORMAL)
  @DisplayName("TS12 - requireAssetExists lança NotFoundException para asset nulo")
  void ts12RequireAssetExistsLancaNotFoundParaAssetNulo() {
    TransferValidationService service = new TransferValidationService(transferRepository);

    assertThatThrownBy(() -> service.requireAssetExists(null))
        .isInstanceOf(NotFoundException.class)
        .hasMessageContaining("Ativo não encontrado");
  }

  @Test
  @Severity(SeverityLevel.CRITICAL)
  @DisplayName("TS13 - validateOwnership lança ForbiddenException para outra organização")
  void ts13ValidateOwnershipLancaForbiddenParaOutraOrganizacao() {
    TransferValidationService service = new TransferValidationService(transferRepository);
    Asset asset = mock(Asset.class);
    var org = mock(com.portfolio.assetmanagement.domain.organization.entity.Organization.class);
    when(asset.getOrganization()).thenReturn(org);
    when(org.getId()).thenReturn(2L);

    assertThatThrownBy(() -> service.validateOwnership(asset, 1L))
        .isInstanceOf(ForbiddenException.class)
        .hasMessageContaining("permissão");
  }

  @Test
  @Severity(SeverityLevel.NORMAL)
  @DisplayName("TS14 - validateAssetAvailableForTransfer bloqueia ativo indisponível")
  void ts14ValidateAssetAvailableForTransferBloqueiaAtivoIndisponivel() {
    TransferValidationService service = new TransferValidationService(transferRepository);
    Asset asset = mock(Asset.class);
    when(asset.getStatus()).thenReturn(AssetStatus.IN_MAINTENANCE);

    assertThatThrownBy(() -> service.validateAssetAvailableForTransfer(asset))
        .isInstanceOf(BusinessException.class)
        .hasMessageContaining("não está disponível");
  }

  @Test
  @Severity(SeverityLevel.NORMAL)
  @DisplayName("TS15 - validateTargetUnit bloqueia transferência para a mesma unidade")
  void ts15ValidateTargetUnitBloqueiaTransferenciaParaMesmaUnidade() {
    TransferValidationService service = new TransferValidationService(transferRepository);
    Unit fromUnit = mock(Unit.class);
    Unit toUnit = mock(Unit.class);
    when(fromUnit.getId()).thenReturn(10L);
    when(toUnit.getId()).thenReturn(10L);

    assertThatThrownBy(() -> service.validateTargetUnit(fromUnit, toUnit))
        .isInstanceOf(BusinessException.class)
        .hasMessageContaining("mesma unidade");
  }

  @Test
  @Severity(SeverityLevel.NORMAL)
  @DisplayName("TS16 - validateNoActiveTransfer bloqueia ativo com transferência ativa")
  void ts16ValidateNoActiveTransferBloqueiaAtivoComTransferenciaAtiva() {
    TransferValidationService service = new TransferValidationService(transferRepository);
    Asset asset = mock(Asset.class);
    when(asset.getId()).thenReturn(100L);
    when(transferRepository.existsByAsset_IdAndStatusIn(
            100L, List.of(TransferStatus.PENDING, TransferStatus.APPROVED)))
        .thenReturn(true);

    assertThatThrownBy(() -> service.validateNoActiveTransfer(asset))
        .isInstanceOf(BusinessException.class)
        .hasMessageContaining("transferência ativa");
  }
}

