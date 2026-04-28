package com.portfolio.assetmanagement.service.asset;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.portfolio.assetmanagement.application.asset.mapper.AssetMapper;
import com.portfolio.assetmanagement.application.asset.service.AssetAssignmentHistoryService;
import com.portfolio.assetmanagement.application.asset.service.AssetNumberGeneratorService;
import com.portfolio.assetmanagement.application.asset.service.AssetService;
import com.portfolio.assetmanagement.application.asset.service.AssetStatusService;
import com.portfolio.assetmanagement.application.asset.service.AssetValidationService;
import com.portfolio.assetmanagement.application.audit.service.AuditService;
import com.portfolio.assetmanagement.domain.asset.entity.Asset;
import com.portfolio.assetmanagement.domain.audit.enums.AuditEventType;
import com.portfolio.assetmanagement.domain.organization.entity.Organization;
import com.portfolio.assetmanagement.domain.unit.entity.Unit;
import com.portfolio.assetmanagement.domain.user.entity.User;
import com.portfolio.assetmanagement.infrastructure.persistence.asset.repository.AssetRepository;
import com.portfolio.assetmanagement.infrastructure.persistence.user.repository.UserRepository;
import com.portfolio.assetmanagement.security.context.LoggedUserContext;
import com.portfolio.assetmanagement.shared.exception.ForbiddenException;
import com.portfolio.assetmanagement.shared.exception.NotFoundException;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("AssetService — Aposentadoria e controle de acesso")
@Tag("testType=Integration")
@Tag("module=Asset")
class AssetRetireServiceTest {

  @Mock private AssetRepository repository;
  @Mock private LoggedUserContext loggedUser;
  @Mock private AssetAssignmentHistoryService assignmentHistoryService;
  @Mock private UserRepository userRepository;
  @Mock private AssetValidationService validationService;
  @Mock private AssetStatusService statusService;
  @Mock private AssetNumberGeneratorService numberGeneratorService;
  @Mock private AssetMapper assetMapper;
  @Mock private AuditService auditService;

  private AssetService service;

  @BeforeEach
  void setUp() {
    service =
        new AssetService(
            repository,
            loggedUser,
            assignmentHistoryService,
            userRepository,
            validationService,
            statusService,
            numberGeneratorService,
            assetMapper,
            auditService);
  }

  @Test
  @DisplayName(
      "[INTEGRACAO][ASSET] AR01 - ADMIN aposenta ativo com sucesso — chama statusService.retire e audit")
  void ar01AdminAposentaAtivoComSucesso() {
    Asset asset = mock(Asset.class);
    Organization org = mock(Organization.class);
    Unit unit = mock(Unit.class);

    when(asset.getId()).thenReturn(1L);
    when(asset.getOrganization()).thenReturn(org);
    when(asset.getUnit()).thenReturn(unit);
    when(org.getId()).thenReturn(10L);
    when(unit.getId()).thenReturn(20L);
    when(repository.findById(1L)).thenReturn(Optional.of(asset));
    when(loggedUser.isAdmin()).thenReturn(true);
    when(loggedUser.getOrganizationId()).thenReturn(10L);
    when(loggedUser.getUserId()).thenReturn(5L);

    service.retireAsset(1L);

    verify(statusService).retire(asset);
    verify(auditService)
        .registerEvent(AuditEventType.ASSET_RETIRED, 5L, 10L, 20L, 1L, "Ativo aposentado");
  }

  @Test
  @DisplayName("[INTEGRACAO][ASSET] AR02 - Ativo não encontrado — lança NotFoundException")
  void ar02AtivoNaoEncontradoLancaNotFoundException() {
    when(repository.findById(999L)).thenReturn(Optional.empty());

    assertThatThrownBy(() -> service.retireAsset(999L)).isInstanceOf(NotFoundException.class);
  }

  @Test
  @DisplayName(
      "[INTEGRACAO][ASSET] AR03 - ADMIN tenta acessar ativo de outra organização — lança ForbiddenException")
  void ar03AdminAcessaAtivoDeOutraOrganizacaoLancaForbidden() {
    Asset asset = mock(Asset.class);
    Organization outroOrg = mock(Organization.class);

    when(asset.getOrganization()).thenReturn(outroOrg);
    when(outroOrg.getId()).thenReturn(99L);
    when(repository.findById(1L)).thenReturn(Optional.of(asset));
    when(loggedUser.isAdmin()).thenReturn(true);
    when(loggedUser.getOrganizationId()).thenReturn(10L);

    assertThatThrownBy(() -> service.retireAsset(1L)).isInstanceOf(ForbiddenException.class);
  }

  @Test
  @DisplayName(
      "[INTEGRACAO][ASSET] AR04 - GESTOR tenta acessar ativo de unidade alheia — lança ForbiddenException")
  void ar04GestorAcessaAtivoDeUnidadeAlheiaLancaForbidden() {
    Asset asset = mock(Asset.class);
    Organization org = mock(Organization.class);
    Unit outraUnidade = mock(Unit.class);

    when(asset.getOrganization()).thenReturn(org);
    when(asset.getUnit()).thenReturn(outraUnidade);
    when(org.getId()).thenReturn(10L);
    when(outraUnidade.getId()).thenReturn(99L);
    when(repository.findById(1L)).thenReturn(Optional.of(asset));
    when(loggedUser.isAdmin()).thenReturn(false);
    when(loggedUser.isManager()).thenReturn(true);
    when(loggedUser.getUnitId()).thenReturn(20L);

    assertThatThrownBy(() -> service.retireAsset(1L)).isInstanceOf(ForbiddenException.class);
  }

  @Test
  @DisplayName(
      "[INTEGRACAO][ASSET] AR05 - OPERADOR tenta acessar ativo não atribuído a ele — lança ForbiddenException")
  void ar05OperadorAcessaAtivoNaoAtribuidoLancaForbidden() {
    Asset asset = mock(Asset.class);
    User outroUsuario = mock(User.class);

    when(asset.getAssignedUser()).thenReturn(outroUsuario);
    when(outroUsuario.getId()).thenReturn(99L);
    when(repository.findById(1L)).thenReturn(Optional.of(asset));
    when(loggedUser.isAdmin()).thenReturn(false);
    when(loggedUser.isManager()).thenReturn(false);
    when(loggedUser.getUserId()).thenReturn(5L);

    assertThatThrownBy(() -> service.retireAsset(1L)).isInstanceOf(ForbiddenException.class);
  }
}
