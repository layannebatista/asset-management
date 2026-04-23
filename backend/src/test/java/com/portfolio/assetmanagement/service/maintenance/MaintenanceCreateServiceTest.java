package com.portfolio.assetmanagement.service.maintenance;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.portfolio.assetmanagement.application.audit.service.AuditService;
import com.portfolio.assetmanagement.application.maintenance.service.MaintenanceLockService;
import com.portfolio.assetmanagement.application.maintenance.service.MaintenanceService;
import com.portfolio.assetmanagement.application.maintenance.service.MaintenanceValidationService;
import com.portfolio.assetmanagement.domain.asset.entity.Asset;
import com.portfolio.assetmanagement.domain.asset.enums.AssetStatus;
import com.portfolio.assetmanagement.domain.maintenance.entity.MaintenanceRecord;
import com.portfolio.assetmanagement.domain.organization.entity.Organization;
import com.portfolio.assetmanagement.domain.unit.entity.Unit;
import com.portfolio.assetmanagement.infrastructure.persistence.asset.repository.AssetRepository;
import com.portfolio.assetmanagement.infrastructure.persistence.maintenance.repository.MaintenanceRepository;
import com.portfolio.assetmanagement.security.context.LoggedUserContext;
import com.portfolio.assetmanagement.shared.exception.BusinessException;
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
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@Epic("Backend")
@Feature("Serviços — Manutenção")
@Story("Criação de manutenção")
@DisplayName("MaintenanceService — Criação")
class MaintenanceCreateServiceTest {

  @Mock private MaintenanceRepository maintenanceRepository;
  @Mock private AssetRepository assetRepository;
  @Mock private AuditService auditService;
  @Mock private LoggedUserContext loggedUser;
  @Mock private MaintenanceValidationService validationService;
  @Mock private MaintenanceLockService lockService;

  @InjectMocks private MaintenanceService maintenanceService;

  private Asset buildAssetMock(Long orgId, Long unitId) {
    Organization org = mock(Organization.class);
    lenient().when(org.getId()).thenReturn(orgId);
    Unit unit = mock(Unit.class);
    lenient().when(unit.getId()).thenReturn(unitId);
    Asset asset = mock(Asset.class);
    lenient().when(asset.getId()).thenReturn(100L);
    lenient().when(asset.getOrganization()).thenReturn(org);
    lenient().when(asset.getUnit()).thenReturn(unit);
    lenient().when(asset.getStatus()).thenReturn(AssetStatus.AVAILABLE);
    var user = mock(com.portfolio.assetmanagement.domain.user.entity.User.class);
    lenient().when(user.getId()).thenReturn(99L);
    lenient().when(asset.getAssignedUser()).thenReturn(user);
    return asset;
  }

  @BeforeEach
  void setup() {
    lenient().when(loggedUser.getUserId()).thenReturn(99L);
    lenient().when(loggedUser.isAdmin()).thenReturn(false);
    lenient().when(loggedUser.isManager()).thenReturn(false);
    lenient().when(loggedUser.getOrganizationId()).thenReturn(1L);
  }

  @Test
  @Severity(SeverityLevel.CRITICAL)
  @DisplayName("MS01 - Deve criar manutenção e mudar status do ativo para IN_MAINTENANCE")
  void ms01DeveCriarEMudarStatusDoAtivo() {
    Asset asset = buildAssetMock(1L, 10L);
    when(assetRepository.findById(100L)).thenReturn(Optional.of(asset));
    when(maintenanceRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

    maintenanceService.create(100L, "Descrição com tamanho suficiente");

    verify(lockService).lockAssetForMaintenance(100L);
    verify(validationService).validateCreate(any(), any());
    verify(asset).changeStatus(AssetStatus.IN_MAINTENANCE);
    verify(maintenanceRepository).save(any(MaintenanceRecord.class));
    verify(auditService).registerEvent(any(), anyLong(), anyLong(), anyLong(), isNull(), any());
  }

  @Test
  @Severity(SeverityLevel.NORMAL)
  @DisplayName("MS02 - Deve lançar NotFoundException quando ativo não existe")
  void ms02DeveLancarQuandoAtivoNaoExiste() {
    when(assetRepository.findById(999L)).thenReturn(Optional.empty());

    assertThatThrownBy(() -> maintenanceService.create(999L, "Descrição"))
        .isInstanceOf(NotFoundException.class)
        .hasMessageContaining("Ativo não encontrado");

    verify(lockService, never()).lockAssetForMaintenance(any());
    verify(maintenanceRepository, never()).save(any());
  }

  @Test
  @Severity(SeverityLevel.NORMAL)
  @DisplayName("MS03 - Deve lançar BusinessException quando já existe manutenção ativa para o ativo")
  void ms03DeveLancarQuandoJaExisteManuAtiva() {
    Asset asset = buildAssetMock(1L, 10L);
    when(assetRepository.findById(100L)).thenReturn(Optional.of(asset));

    doThrow(new BusinessException("Já existe manutenção ativa para este ativo"))
        .when(lockService)
        .lockAssetForMaintenance(100L);

    assertThatThrownBy(() -> maintenanceService.create(100L, "Descrição"))
        .isInstanceOf(BusinessException.class)
        .hasMessageContaining("Já existe manutenção ativa");

    verify(maintenanceRepository, never()).save(any());
  }
}

