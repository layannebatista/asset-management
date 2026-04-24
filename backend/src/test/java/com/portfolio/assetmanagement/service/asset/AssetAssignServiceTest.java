package com.portfolio.assetmanagement.service.asset;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
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
import com.portfolio.assetmanagement.shared.exception.NotFoundException;
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
@DisplayName("AssetService — Atribuição e desatribuição")
@Tag("testType=Integration")
@Tag("module=Asset")
class AssetAssignServiceTest {

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
  @DisplayName("AA01 - ADMIN atribui ativo com sucesso — verifica status, histórico e audit")
  void aa01AdminAtribuiAtivoComSucesso() {
    Asset asset = mock(Asset.class);
    Organization org = mock(Organization.class);
    Unit unit = mock(Unit.class);
    User user = mock(User.class);

    when(asset.getId()).thenReturn(1L);
    when(asset.getOrganization()).thenReturn(org);
    when(asset.getUnit()).thenReturn(unit);
    when(asset.getAssignedUser()).thenReturn(null);
    when(org.getId()).thenReturn(10L);
    when(unit.getId()).thenReturn(20L);
    when(repository.findById(1L)).thenReturn(Optional.of(asset));
    when(userRepository.findById(50L)).thenReturn(Optional.of(user));
    when(loggedUser.isAdmin()).thenReturn(true);
    when(loggedUser.getOrganizationId()).thenReturn(10L);
    when(loggedUser.getUserId()).thenReturn(5L);

    service.assignAsset(1L, 50L);

    verify(validationService).validateAssignmentIntegrity(asset, user);
    verify(statusService).assign(asset, user);
    verify(assignmentHistoryService).registerAssignmentChange(asset, null, 50L);
    verify(auditService)
        .registerEvent(
            AuditEventType.ASSET_ASSIGNED, 5L, 10L, 20L, 1L, "Ativo atribuido ao usuario #50");
  }

  @Test
  @DisplayName("AA02 - Usuário não encontrado ao atribuir — lança NotFoundException")
  void aa02UsuarioNaoEncontradoLancaNotFoundException() {
    Asset asset = mock(Asset.class);
    Organization org = mock(Organization.class);

    when(asset.getOrganization()).thenReturn(org);
    when(org.getId()).thenReturn(10L);
    when(repository.findById(1L)).thenReturn(Optional.of(asset));
    when(userRepository.findById(999L)).thenReturn(Optional.empty());
    when(loggedUser.isAdmin()).thenReturn(true);
    when(loggedUser.getOrganizationId()).thenReturn(10L);

    assertThatThrownBy(() -> service.assignAsset(1L, 999L))
        .isInstanceOf(NotFoundException.class);
  }

  @Test
  @DisplayName("AA03 - ADMIN desatribui ativo com sucesso — verifica unassign, histórico e audit")
  void aa03AdminDesatribuiAtivoComSucesso() {
    Asset asset = mock(Asset.class);
    Organization org = mock(Organization.class);
    Unit unit = mock(Unit.class);
    User assignedUser = mock(User.class);

    when(asset.getId()).thenReturn(1L);
    when(asset.getOrganization()).thenReturn(org);
    when(asset.getUnit()).thenReturn(unit);
    when(asset.getAssignedUser()).thenReturn(assignedUser);
    when(assignedUser.getId()).thenReturn(77L);
    when(org.getId()).thenReturn(10L);
    when(unit.getId()).thenReturn(20L);
    when(repository.findById(1L)).thenReturn(Optional.of(asset));
    when(loggedUser.isAdmin()).thenReturn(true);
    when(loggedUser.getOrganizationId()).thenReturn(10L);
    when(loggedUser.getUserId()).thenReturn(5L);

    service.unassignAsset(1L);

    verify(statusService).unassign(asset);
    verify(assignmentHistoryService).registerAssignmentChange(eq(asset), eq(77L), isNull());
    verify(auditService)
        .registerEvent(AuditEventType.ASSET_UNASSIGNED, 5L, 10L, 20L, 1L, "Ativo desatribuido");
  }
}

