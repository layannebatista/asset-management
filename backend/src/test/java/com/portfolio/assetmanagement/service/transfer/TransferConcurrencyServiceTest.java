package com.portfolio.assetmanagement.service.transfer;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.portfolio.assetmanagement.application.transfer.service.TransferConcurrencyService;
import com.portfolio.assetmanagement.domain.asset.entity.Asset;
import com.portfolio.assetmanagement.infrastructure.persistence.asset.repository.AssetRepository;
import com.portfolio.assetmanagement.shared.exception.NotFoundException;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import io.qameta.allure.Severity;
import io.qameta.allure.SeverityLevel;
import io.qameta.allure.Story;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import java.lang.reflect.Field;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicBoolean;
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
@Story("Concorrência")
@DisplayName("TransferConcurrencyService")
@Tag("testType=Integration")
@Tag("module=Transfer")
class TransferConcurrencyServiceTest {

  @Mock private AssetRepository assetRepository;
  @Mock private EntityManager entityManager;

  private TransferConcurrencyService service;

  @BeforeEach
  void setup() {
    service = new TransferConcurrencyService(assetRepository);
    injectEntityManager();
  }

  @Test
  @Severity(SeverityLevel.CRITICAL)
  @DisplayName("TS19 - executeWithAssetLock aplica lock pessimista e executa operação")
  void ts19ExecuteWithAssetLockAplicaLockPessimistaEExecutaOperacao() {
    Asset asset = mock(Asset.class);
    AtomicBoolean executed = new AtomicBoolean(false);
    when(assetRepository.findById(100L)).thenReturn(Optional.of(asset));

    service.executeWithAssetLock(100L, () -> executed.set(true));

    verify(entityManager).lock(asset, LockModeType.PESSIMISTIC_WRITE);
    assertThat(executed.get()).isTrue();
  }

  @Test
  @Severity(SeverityLevel.NORMAL)
  @DisplayName("TS20 - executeWithAssetLock falha quando assetId é nulo")
  void ts20ExecuteWithAssetLockFalhaQuandoAssetIdENulo() {
    assertThatThrownBy(() -> service.executeWithAssetLock(null, () -> {}))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessageContaining("assetId é obrigatório");
  }

  @Test
  @Severity(SeverityLevel.NORMAL)
  @DisplayName("TS21 - executeWithAssetLock lança NotFoundException para ativo inexistente")
  void ts21ExecuteWithAssetLockLancaNotFoundParaAtivoInexistente() {
    when(assetRepository.findById(999L)).thenReturn(Optional.empty());

    assertThatThrownBy(() -> service.executeWithAssetLock(999L, () -> {}))
        .isInstanceOf(NotFoundException.class)
        .hasMessageContaining("Ativo não encontrado");
  }

  private void injectEntityManager() {
    try {
      Field field = TransferConcurrencyService.class.getDeclaredField("entityManager");
      field.setAccessible(true);
      field.set(service, entityManager);
    } catch (ReflectiveOperationException ex) {
      throw new IllegalStateException("Falha ao injetar EntityManager", ex);
    }
  }
}

