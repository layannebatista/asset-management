package com.portfolio.assetmanagement.service.depreciation;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.portfolio.assetmanagement.application.depreciation.dto.DepreciationResultDTO;
import com.portfolio.assetmanagement.application.depreciation.service.DepreciationService;
import com.portfolio.assetmanagement.domain.asset.entity.Asset;
import com.portfolio.assetmanagement.domain.asset.enums.AssetType;
import com.portfolio.assetmanagement.domain.depreciation.enums.DepreciationMethod;
import com.portfolio.assetmanagement.domain.organization.entity.Organization;
import com.portfolio.assetmanagement.domain.unit.entity.Unit;
import com.portfolio.assetmanagement.infrastructure.persistence.asset.repository.AssetRepository;
import com.portfolio.assetmanagement.security.context.LoggedUserContext;
import com.portfolio.assetmanagement.shared.exception.BusinessException;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import io.qameta.allure.Story;
import io.qameta.allure.Severity;
import io.qameta.allure.SeverityLevel;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.Tag;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@Epic("Backend")
@Feature("Serviços — Depreciação")
@DisplayName("Serviço de Depreciação")
@Tag("testType=Integration")
@Tag("module=Depreciation")
class DepreciationServiceTest {

@Mock private AssetRepository assetRepository;
@Mock private LoggedUserContext loggedUser;

@InjectMocks private DepreciationService depreciationService;

private Asset createAsset(
BigDecimal purchaseValue,
BigDecimal residual,
Integer lifeMonths,
DepreciationMethod method,
LocalDate purchaseDate) {

Organization org = mock(Organization.class);
lenient().when(org.getId()).thenReturn(1L);

Unit unit = mock(Unit.class);
lenient().when(unit.getId()).thenReturn(1L);
lenient().when(unit.getOrganization()).thenReturn(org);

Asset asset = new Asset("TAG-001", AssetType.NOTEBOOK, "Test Model", org, unit);

asset.setPurchaseValue(purchaseValue);
asset.setResidualValue(residual);
asset.setUsefulLifeMonths(lifeMonths);
asset.setDepreciationMethod(method);
asset.setPurchaseDate(purchaseDate);

return asset;

}

@Nested
@DisplayName("Depreciação Linear (Quotas Constantes)")
@Story("Cálculo Linear")
@Tag("testType=Integration")
@Tag("module=Depreciation")
class Linear {

@Test
@Severity(SeverityLevel.CRITICAL)
@DisplayName("Depreciação após 12 meses deve ser proporcional")
void linearAfter12Months() {

  Asset asset =
      createAsset(
          new BigDecimal("12000.00"),
          BigDecimal.ZERO,
          60,
          DepreciationMethod.LINEAR,
          LocalDate.now().minusMonths(12));

  when(assetRepository.findById(1L)).thenReturn(Optional.of(asset));

  DepreciationResultDTO result = depreciationService.calculate(1L);

  assertThat(result.getAccumulatedDepreciation())
      .isEqualByComparingTo(new BigDecimal("2400.00"));

  assertThat(result.getCurrentValue()).isEqualByComparingTo(new BigDecimal("9600.00"));

  assertThat(result.getElapsedMonths()).isEqualTo(12);
  assertThat(result.getRemainingMonths()).isEqualTo(48);
  assertThat(result.isFullyDepreciated()).isFalse();
}

@Test
@Severity(SeverityLevel.NORMAL)
@DisplayName("Deve respeitar valor residual")
void linearRespectsResidualValue() {

  Asset asset =
      createAsset(
          new BigDecimal("10000.00"),
          new BigDecimal("1000.00"),
          24,
          DepreciationMethod.LINEAR,
          LocalDate.now().minusMonths(30));

  when(assetRepository.findById(1L)).thenReturn(Optional.of(asset));

  DepreciationResultDTO result = depreciationService.calculate(1L);

  assertThat(result.getAccumulatedDepreciation())
      .isEqualByComparingTo(new BigDecimal("9000.00"));

  assertThat(result.getCurrentValue()).isEqualByComparingTo(new BigDecimal("1000.00"));
  assertThat(result.isFullyDepreciated()).isTrue();
}

@Test
@Severity(SeverityLevel.NORMAL)
@DisplayName("Deve atingir 100% ao final da vida útil")
void linearFullyDepreciatedAt100Percent() {

  Asset asset =
      createAsset(
          new BigDecimal("5000.00"),
          BigDecimal.ZERO,
          12,
          DepreciationMethod.LINEAR,
          LocalDate.now().minusMonths(12));

  when(assetRepository.findById(1L)).thenReturn(Optional.of(asset));

  DepreciationResultDTO result = depreciationService.calculate(1L);

  assertThat(result.getDepreciationPercentage())
      .isEqualByComparingTo(new BigDecimal("100.00"));

  assertThat(result.isFullyDepreciated()).isTrue();
}

}

@Nested
@DisplayName("Depreciação Saldo Decrescente")
@Story("Cálculo Acelerado")
@Tag("testType=Integration")
@Tag("module=Depreciation")
class DecliningBalance {

@Test
@Severity(SeverityLevel.NORMAL)
@DisplayName("Método acelerado deve depreciar mais rápido que linear no início")
void decliningFasterThanLinearInFirstYear() {

  BigDecimal purchaseValue = new BigDecimal("10000.00");

  Asset linearAsset =
      createAsset(
          purchaseValue, BigDecimal.ZERO, 60,
          DepreciationMethod.LINEAR, LocalDate.now().minusMonths(12));

  Asset decliningAsset =
      createAsset(
          purchaseValue, BigDecimal.ZERO, 60,
          DepreciationMethod.DECLINING_BALANCE, LocalDate.now().minusMonths(12));

  when(assetRepository.findById(1L)).thenReturn(Optional.of(linearAsset));
  DepreciationResultDTO linearResult = depreciationService.calculate(1L);

  when(assetRepository.findById(1L)).thenReturn(Optional.of(decliningAsset));
  DepreciationResultDTO decliningResult = depreciationService.calculate(1L);

  assertThat(decliningResult.getAccumulatedDepreciation())
      .isGreaterThan(linearResult.getAccumulatedDepreciation());
}

}

@Nested
@DisplayName("Depreciação Soma dos Dígitos dos Anos")
@Story("Cálculo Acelerado")
@Tag("testType=Integration")
@Tag("module=Depreciation")
class SumOfYears {

@Test
@Severity(SeverityLevel.NORMAL)
@DisplayName("Método soma dos dígitos deve ser mais rápido que linear no início")
void sydFasterThanLinearInitially() {

  BigDecimal purchaseValue = new BigDecimal("12000.00");

  Asset linearAsset =
      createAsset(
          purchaseValue, BigDecimal.ZERO, 24,
          DepreciationMethod.LINEAR, LocalDate.now().minusMonths(6));

  Asset sydAsset =
      createAsset(
          purchaseValue, BigDecimal.ZERO, 24,
          DepreciationMethod.SUM_OF_YEARS, LocalDate.now().minusMonths(6));

  when(assetRepository.findById(1L)).thenReturn(Optional.of(linearAsset));
  DepreciationResultDTO linearResult = depreciationService.calculate(1L);

  when(assetRepository.findById(1L)).thenReturn(Optional.of(sydAsset));
  DepreciationResultDTO sydResult = depreciationService.calculate(1L);

  assertThat(sydResult.getAccumulatedDepreciation())
      .isGreaterThan(linearResult.getAccumulatedDepreciation());
}

}

@Nested
@DisplayName("ValidaçÃµes")
@Story("Validação de dados")
@Tag("testType=Integration")
@Tag("module=Depreciation")
class Validations {

@Test
@Severity(SeverityLevel.CRITICAL)
@DisplayName("Deve lançar exceção quando não há valor de compra")
void throwsWhenNoPurchaseValue() {

  Asset asset =
      createAsset(null, null, 60,
          DepreciationMethod.LINEAR, LocalDate.now().minusMonths(6));

  when(assetRepository.findById(1L)).thenReturn(Optional.of(asset));

  assertThatThrownBy(() -> depreciationService.calculate(1L))
      .isInstanceOf(BusinessException.class)
      .hasMessageContaining("purchaseValue");
}

@Test
@Severity(SeverityLevel.CRITICAL)
@DisplayName("Deve lançar exceção quando não há vida útil")
void throwsWhenNoUsefulLife() {

  Asset asset =
      createAsset(
          new BigDecimal("5000"),
          null,
          null,
          DepreciationMethod.LINEAR,
          LocalDate.now().minusMonths(6));

  when(assetRepository.findById(1L)).thenReturn(Optional.of(asset));

  assertThatThrownBy(() -> depreciationService.calculate(1L))
      .isInstanceOf(BusinessException.class)
      .hasMessageContaining("usefulLifeMonths");
}

}
}

