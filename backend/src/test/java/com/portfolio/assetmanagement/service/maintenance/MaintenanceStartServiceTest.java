package com.portfolio.assetmanagement.service.maintenance;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
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
import com.portfolio.assetmanagement.domain.maintenance.enums.MaintenanceStatus;
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
@Story("Execução de manutenção")
@DisplayName("MaintenanceService — Iniciar")
class MaintenanceStartServiceTest {

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

  private MaintenanceRecord buildRecordMock(MaintenanceStatus status) {
    Asset asset = buildAssetMock(1L, 10L);
    MaintenanceRecord record = mock(MaintenanceRecord.class);
    lenient().when(record.getId()).thenReturn(55L);
    lenient().when(record.getStatus()).thenReturn(status);
    lenient().when(record.getOrganizationId()).thenReturn(1L);
    lenient().when(record.getAsset()).thenReturn(asset);
    return record;
  }

  @BeforeEach
  void setup() {
    lenient().when(loggedUser.getUserId()).thenReturn(99L);
    lenient().when(loggedUser.isAdmin()).thenReturn(false);
    lenient().when(loggedUser.isManager()).thenReturn(false);
  }

  @Test
  @Severity(SeverityLevel.CRITICAL)
  @DisplayName("MS04 - Deve iniciar manutenção corretamente")
  void ms04DeveIniciarCorretamente() {
    MaintenanceRecord record = buildRecordMock(MaintenanceStatus.REQUESTED);
    when(maintenanceRepository.findById(55L)).thenReturn(Optional.of(record));

    maintenanceService.start(55L);

    verify(lockService).lockMaintenance(55L);
    verify(validationService).validateStart(record);
    verify(record).start(99L);
    verify(auditService).registerEvent(any(), anyLong(), anyLong(), anyLong(), anyLong(), any());
  }

  @Test
  @Severity(SeverityLevel.NORMAL)
  @DisplayName("MS05 - Deve lançar NotFoundException quando manutenção não existe")
  void ms05DeveLancarQuandoManuNaoExiste() {
    when(maintenanceRepository.findById(999L)).thenReturn(Optional.empty());

    assertThatThrownBy(() -> maintenanceService.start(999L))
        .isInstanceOf(NotFoundException.class)
        .hasMessageContaining("Manutenção não encontrada");

    verify(validationService, never()).validateStart(any());
  }

  @Test
  @Severity(SeverityLevel.NORMAL)
  @DisplayName("MS06 - Deve lançar BusinessException quando validação falha ao iniciar")
  void ms06DeveLancarQuandoValidacaoFalha() {
    MaintenanceRecord record = buildRecordMock(MaintenanceStatus.COMPLETED);
    when(maintenanceRepository.findById(55L)).thenReturn(Optional.of(record));

    doThrow(new BusinessException("Manutenção não pode ser iniciada neste estado"))
        .when(validationService)
        .validateStart(record);

    assertThatThrownBy(() -> maintenanceService.start(55L)).isInstanceOf(BusinessException.class);

    verify(record, never()).start(anyLong());
  }
}

