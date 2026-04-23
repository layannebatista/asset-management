package com.portfolio.assetmanagement.service.asset;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.portfolio.assetmanagement.application.asset.service.AssetAssignmentHistoryService;
import com.portfolio.assetmanagement.application.asset.service.AssetNumberGeneratorService;
import com.portfolio.assetmanagement.application.asset.service.AssetService;
import com.portfolio.assetmanagement.application.asset.service.AssetStatusService;
import com.portfolio.assetmanagement.application.asset.service.AssetValidationService;
import com.portfolio.assetmanagement.application.audit.service.AuditService;
import com.portfolio.assetmanagement.domain.asset.entity.Asset;
import com.portfolio.assetmanagement.domain.asset.enums.AssetType;
import com.portfolio.assetmanagement.domain.audit.enums.AuditEventType;
import com.portfolio.assetmanagement.domain.organization.entity.Organization;
import com.portfolio.assetmanagement.domain.unit.entity.Unit;
import com.portfolio.assetmanagement.infrastructure.persistence.asset.repository.AssetRepository;
import com.portfolio.assetmanagement.infrastructure.persistence.user.repository.UserRepository;
import com.portfolio.assetmanagement.security.context.LoggedUserContext;
import com.portfolio.assetmanagement.shared.exception.BusinessException;
import com.portfolio.assetmanagement.shared.exception.ForbiddenException;
import com.portfolio.assetmanagement.application.asset.mapper.AssetMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.dao.DataIntegrityViolationException;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("AssetService — Criação de ativo")
class AssetCreateServiceTest {

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
  @DisplayName("AC01 - ADMIN cria ativo com sucesso — valida tag, unicidade e integridade")
  void ac01AdminCriaAtivoComValidacoes() {
    Organization org = mock(Organization.class);
    Unit unit = mock(Unit.class);
    Asset savedAsset = mock(Asset.class);

    when(loggedUser.isAdmin()).thenReturn(true);
    when(loggedUser.getUserId()).thenReturn(1L);
    when(org.getId()).thenReturn(10L);
    when(unit.getId()).thenReturn(20L);
    when(savedAsset.getId()).thenReturn(100L);
    when(repository.save(any(Asset.class))).thenReturn(savedAsset);

    service.createAsset("TAG-001", AssetType.NOTEBOOK, "Dell XPS", org, unit);

    verify(validationService).validateAssetTag("TAG-001");
    verify(validationService).validateAssetTagUniqueness("TAG-001");
    verify(validationService).validateOrganizationUnitIntegrity(org, unit);
    verify(auditService)
        .registerEvent(
            AuditEventType.ASSET_CREATED, 1L, 10L, 20L, 100L, "Ativo criado");
  }

  @Test
  @DisplayName("AC02 - GESTOR tenta criar ativo em unidade alheia — lança ForbiddenException")
  void ac02GestorNaoPodeCriarEmUnidadeAlheia() {
    Organization org = mock(Organization.class);
    Unit unit = mock(Unit.class);

    when(loggedUser.isAdmin()).thenReturn(false);
    when(loggedUser.isManager()).thenReturn(true);
    when(loggedUser.getUnitId()).thenReturn(20L);
    when(unit.getId()).thenReturn(99L);

    assertThatThrownBy(
            () -> service.createAsset("TAG-002", AssetType.DESKTOP, "LG 27", org, unit))
        .isInstanceOf(ForbiddenException.class);
  }

  @Test
  @DisplayName("AC03 - createAssetAutoTag gera tag e persiste ativo com sucesso")
  void ac03CreateAssetAutoTagComSucesso() {
    Organization org = mock(Organization.class);
    Unit unit = mock(Unit.class);
    Asset savedAsset = mock(Asset.class);

    when(loggedUser.isAdmin()).thenReturn(true);
    when(loggedUser.getUserId()).thenReturn(1L);
    when(org.getId()).thenReturn(10L);
    when(unit.getId()).thenReturn(20L);
    when(savedAsset.getId()).thenReturn(101L);
    when(numberGeneratorService.generate()).thenReturn("AUTO-001");
    when(repository.save(any(Asset.class))).thenReturn(savedAsset);

    service.createAssetAutoTag(AssetType.NOTEBOOK, "MacBook Pro", org, unit);

    verify(numberGeneratorService).generate();
    verify(repository).save(any(Asset.class));
    verify(auditService)
        .registerEvent(
            AuditEventType.ASSET_CREATED, 1L, 10L, 20L, 101L, "Ativo criado");
  }

  @Test
  @DisplayName("AC04 - createAssetAutoTag com colisão de tag — lança BusinessException")
  void ac04CreateAssetAutoTagComColisaoLancaBusinessException() {
    Organization org = mock(Organization.class);
    Unit unit = mock(Unit.class);

    when(loggedUser.isAdmin()).thenReturn(true);
    when(numberGeneratorService.generate()).thenReturn("AUTO-DUP");
    when(repository.save(any(Asset.class)))
        .thenThrow(new DataIntegrityViolationException("duplicate"));

    assertThatThrownBy(
            () -> service.createAssetAutoTag(AssetType.NOTEBOOK, "Dell", org, unit))
        .isInstanceOf(BusinessException.class);
  }
}

