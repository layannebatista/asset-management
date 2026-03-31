package com.portfolio.assetmanagement.service.maintenance;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
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
import com.portfolio.assetmanagement.domain.maintenance.enums.MaintenanceStatus;
import com.portfolio.assetmanagement.domain.organization.entity.Organization;
import com.portfolio.assetmanagement.domain.unit.entity.Unit;
import com.portfolio.assetmanagement.infrastructure.persistence.asset.repository.AssetRepository;
import com.portfolio.assetmanagement.infrastructure.persistence.maintenance.repository.MaintenanceRepository;
import com.portfolio.assetmanagement.security.context.LoggedUserContext;
import com.portfolio.assetmanagement.shared.exception.BusinessException;
import com.portfolio.assetmanagement.shared.exception.NotFoundException;
import java.math.BigDecimal;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
@DisplayName("MaintenanceService — orquestração e regras de negócio")
class MaintenanceServiceTest {

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

    // 🔥 CORREÇÃO AQUI — usuário com acesso
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

  @Nested
  @DisplayName("create()")
  class CreateTest {

    @BeforeEach
    void setup() {
      lenient().when(loggedUser.getUserId()).thenReturn(99L);
      lenient().when(loggedUser.isAdmin()).thenReturn(false);
      lenient().when(loggedUser.isManager()).thenReturn(false);
      lenient().when(loggedUser.getOrganizationId()).thenReturn(1L);
    }

    @Test
    @DisplayName("deve criar manutenção e mudar status do ativo para IN_MAINTENANCE")
    void deveCriarEMudarStatusDoAtivo() {
      Asset asset = buildAssetMock(1L, 10L);
      when(assetRepository.findById(100L)).thenReturn(Optional.of(asset));
      when(maintenanceRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

      MaintenanceRecord result =
          maintenanceService.create(100L, "Descrição com tamanho suficiente");

      verify(lockService).lockAssetForMaintenance(100L);
      verify(validationService).validateCreate(eq(asset), any());
      verify(asset).changeStatus(AssetStatus.IN_MAINTENANCE);
      verify(maintenanceRepository).save(any(MaintenanceRecord.class));
      verify(auditService).registerEvent(any(), anyLong(), anyLong(), anyLong(), isNull(), any());
    }

    @Test
    @DisplayName("deve lançar NotFoundException quando ativo não existe")
    void deveLancarQuandoAtivoNaoExiste() {
      when(assetRepository.findById(999L)).thenReturn(Optional.empty());

      assertThatThrownBy(() -> maintenanceService.create(999L, "Descrição"))
          .isInstanceOf(NotFoundException.class)
          .hasMessageContaining("Ativo não encontrado");

      verify(lockService, never()).lockAssetForMaintenance(any());
      verify(maintenanceRepository, never()).save(any());
    }

    @Test
    @DisplayName("deve lançar BusinessException quando já existe manutenção ativa para o ativo")
    void deveLancarQuandoJaExisteManuAtiva() {
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

  @Nested
  @DisplayName("start()")
  class StartTest {

    @BeforeEach
    void setup() {
      lenient().when(loggedUser.getUserId()).thenReturn(99L);
      lenient().when(loggedUser.isAdmin()).thenReturn(false);
      lenient().when(loggedUser.isManager()).thenReturn(false);
    }

    @Test
    void deveIniciarCorretamente() {
      MaintenanceRecord record = buildRecordMock(MaintenanceStatus.REQUESTED);
      when(maintenanceRepository.findById(55L)).thenReturn(Optional.of(record));

      maintenanceService.start(55L);

      verify(lockService).lockMaintenance(55L);
      verify(validationService).validateStart(record);
      verify(record).start(99L);
      verify(auditService).registerEvent(any(), anyLong(), anyLong(), anyLong(), anyLong(), any());
    }

    @Test
    void deveLancarQuandoManuNaoExiste() {
      when(maintenanceRepository.findById(999L)).thenReturn(Optional.empty());

      assertThatThrownBy(() -> maintenanceService.start(999L))
          .isInstanceOf(NotFoundException.class)
          .hasMessageContaining("Manutenção não encontrada");

      verify(validationService, never()).validateStart(any());
    }

    @Test
    void deveLancarQuandoValidacaoFalha() {
      MaintenanceRecord record = buildRecordMock(MaintenanceStatus.COMPLETED);
      when(maintenanceRepository.findById(55L)).thenReturn(Optional.of(record));

      doThrow(new BusinessException("Manutenção não pode ser iniciada neste estado"))
          .when(validationService)
          .validateStart(record);

      assertThatThrownBy(() -> maintenanceService.start(55L)).isInstanceOf(BusinessException.class);

      verify(record, never()).start(anyLong());
    }
  }

  @Nested
  @DisplayName("complete()")
  class CompleteTest {

    @BeforeEach
    void setup() {
      lenient().when(loggedUser.getUserId()).thenReturn(99L);
      lenient().when(loggedUser.isAdmin()).thenReturn(true); // 🔥 CORREÇÃO
      lenient().when(loggedUser.isManager()).thenReturn(false);
    }

    @Test
    void deveConcluirERetornarAssetParaAvailable() {
      MaintenanceRecord record = buildRecordMock(MaintenanceStatus.IN_PROGRESS);
      Asset asset = record.getAsset(); // 🔥 IMPORTANTE

      when(asset.getAssignedUser()).thenReturn(null);
      when(maintenanceRepository.findById(55L)).thenReturn(Optional.of(record));

      maintenanceService.complete(55L, "Troca da bateria", BigDecimal.ZERO);

      verify(lockService).lockMaintenance(55L);
      verify(validationService).validateComplete(record, "Troca da bateria");
      verify(record).complete(99L, "Troca da bateria", BigDecimal.ZERO);
      verify(asset).changeStatus(AssetStatus.AVAILABLE);
    }

    @Test
    void deveRetornarAssetParaAssignedQuandoTinhaUsuario() {
      MaintenanceRecord record = buildRecordMock(MaintenanceStatus.IN_PROGRESS);
      Asset asset = record.getAsset();

      when(asset.getAssignedUser())
          .thenReturn(mock(com.portfolio.assetmanagement.domain.user.entity.User.class));

      when(maintenanceRepository.findById(55L)).thenReturn(Optional.of(record));

      maintenanceService.complete(55L, "Troca da bateria", BigDecimal.ZERO);

      verify(asset).changeStatus(AssetStatus.ASSIGNED);
    }

    @Test
    void deveLancarQuandoResolucaoAusente() {
      MaintenanceRecord record = buildRecordMock(MaintenanceStatus.IN_PROGRESS);
      when(maintenanceRepository.findById(55L)).thenReturn(Optional.of(record));

      doThrow(new BusinessException("Resolução é obrigatória"))
          .when(validationService)
          .validateComplete(record, "");

      assertThatThrownBy(() -> maintenanceService.complete(55L, "", BigDecimal.ZERO))
          .isInstanceOf(BusinessException.class);

      verify(record, never()).complete(anyLong(), any(), any());
    }
  }

  @Nested
  @DisplayName("cancel()")
  class CancelTest {

    @BeforeEach
    void setup() {
      lenient().when(loggedUser.getUserId()).thenReturn(99L);
      lenient().when(loggedUser.isAdmin()).thenReturn(true); // 🔥 CORREÇÃO
      lenient().when(loggedUser.isManager()).thenReturn(false);
    }

    @Test
    void deveCancelarELiberarAtivo() {
      MaintenanceRecord record = buildRecordMock(MaintenanceStatus.REQUESTED);
      Asset asset = record.getAsset();

      when(asset.getAssignedUser()).thenReturn(null);
      when(maintenanceRepository.findById(55L)).thenReturn(Optional.of(record));

      maintenanceService.cancel(55L);

      verify(lockService).lockMaintenance(55L);
      verify(validationService).validateCancel(record);
      verify(record).cancel();
      verify(asset).changeStatus(AssetStatus.AVAILABLE);
      verify(auditService).registerEvent(any(), anyLong(), anyLong(), anyLong(), anyLong(), any());
    }

    @Test
    void deveLancarAoCancelarConcluida() {
      MaintenanceRecord record = buildRecordMock(MaintenanceStatus.COMPLETED);
      when(maintenanceRepository.findById(55L)).thenReturn(Optional.of(record));

      doThrow(new BusinessException("Manutenção já foi concluída"))
          .when(validationService)
          .validateCancel(record);

      assertThatThrownBy(() -> maintenanceService.cancel(55L))
          .isInstanceOf(BusinessException.class);

      verify(record, never()).cancel();
    }
  }
}
