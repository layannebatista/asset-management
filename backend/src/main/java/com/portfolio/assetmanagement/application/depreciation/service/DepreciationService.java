package com.portfolio.assetmanagement.application.depreciation.service;

import com.portfolio.assetmanagement.application.depreciation.dto.DepreciationReportDTO;
import com.portfolio.assetmanagement.application.depreciation.dto.DepreciationResultDTO;
import com.portfolio.assetmanagement.application.depreciation.dto.PortfolioValueDTO;
import com.portfolio.assetmanagement.domain.asset.entity.Asset;
import com.portfolio.assetmanagement.domain.depreciation.enums.DepreciationMethod;
import com.portfolio.assetmanagement.infrastructure.persistence.asset.repository.AssetRepository;
import com.portfolio.assetmanagement.security.context.LoggedUserContext;
import com.portfolio.assetmanagement.shared.exception.BusinessException;
import com.portfolio.assetmanagement.shared.exception.NotFoundException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Serviço de cálculo de depreciação de ativos.
 *
 * <p>Implementa os três métodos de depreciação contábil mais usados no Brasil e em empresas que
 * seguem IFRS/CPC:
 *
 * <ol>
 *   <li><b>Linear (Quotas Constantes)</b> — CPC 27 / IAS 16. Deprecia o mesmo valor a cada período.
 *       Simples, auditável, padrão para a maioria dos ativos.
 *   <li><b>Saldo Decrescente (Declining Balance)</b> — Taxa aplicada sobre o valor residual de cada
 *       período. Deprecia mais rápido no início. Usado para equipamentos que perdem valor
 *       rapidamente (servidores, veículos).
 *   <li><b>Soma dos Dígitos dos Anos (SYD)</b> — Método acelerado. A quota de cada período diminui
 *       proporcionalmente. Comum em análise financeira de TI.
 * </ol>
 *
 * <p><b>Fórmulas aplicadas:</b>
 *
 * <ul>
 *   <li>Linear: {@code Quota = (Valor Aquisição - Valor Residual) / Vida Útil}
 *   <li>Saldo Decrescente: {@code Taxa = 2 / Vida Útil; Depreciação = Taxa × Valor Atual}
 *   <li>SYD: {@code Quota = Anos Restantes / SYD × (Valor Aquisição - Valor Residual)}
 * </ul>
 */
@Service
public class DepreciationService {

  private final AssetRepository assetRepository;
  private final LoggedUserContext loggedUser;

  public DepreciationService(AssetRepository assetRepository, LoggedUserContext loggedUser) {
    this.assetRepository = assetRepository;
    this.loggedUser = loggedUser;
  }

  // ════════════════════════════════════════════════════
  //  POR ATIVO
  // ════════════════════════════════════════════════════

  /**
   * Calcula a depreciação atual de um ativo específico.
   *
   * @param assetId ID do ativo
   * @return resultado detalhado com valor atual, acumulado e % depreciado
   */
  @Transactional(readOnly = true)
  public DepreciationResultDTO calculate(Long assetId) {
    Asset asset =
        assetRepository
            .findById(assetId)
            .orElseThrow(() -> new NotFoundException("Ativo não encontrado"));

    validateDepreciationFields(asset);

    return computeResult(asset, LocalDate.now());
  }

  // ════════════════════════════════════════════════════
  //  RELATÓRIO CONSOLIDADO (PORTFÓLIO)
  // ════════════════════════════════════════════════════

  /**
   * Valoração do portfólio completo da organização com depreciação aplicada.
   *
   * <p>Retorna: valor original total, valor atual depreciado, depreciação acumulada, e breakdown
   * por tipo de ativo e unidade.
   */
  @Transactional(readOnly = true)
  public PortfolioValueDTO getPortfolioValue() {
    Long orgId = loggedUser.getOrganizationId();
    List<Asset> assets = assetRepository.findByOrganizationIdWithDepreciation(orgId);

    BigDecimal totalPurchase = BigDecimal.ZERO;
    BigDecimal totalCurrentValue = BigDecimal.ZERO;
    BigDecimal totalDepreciated = BigDecimal.ZERO;

    for (Asset asset : assets) {
      if (asset.getPurchaseValue() == null || asset.getUsefulLifeMonths() == null) continue;

      DepreciationResultDTO result = computeResult(asset, LocalDate.now());
      totalPurchase = totalPurchase.add(asset.getPurchaseValue());
      totalCurrentValue = totalCurrentValue.add(result.getCurrentValue());
      totalDepreciated = totalDepreciated.add(result.getAccumulatedDepreciation());
    }

    PortfolioValueDTO dto = new PortfolioValueDTO();
    dto.setTotalPurchaseValue(totalPurchase);
    dto.setTotalCurrentValue(totalCurrentValue);
    dto.setTotalDepreciation(totalDepreciated);
    dto.setDepreciationPercentage(
        totalPurchase.compareTo(BigDecimal.ZERO) > 0
            ? totalDepreciated
                .divide(totalPurchase, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
            : BigDecimal.ZERO);
    dto.setTotalAssets((long) assets.size());
    dto.setCalculationDate(LocalDate.now());
    return dto;
  }

  /** Relatório detalhado de depreciação por ativo da organização. */
  @Transactional(readOnly = true)
  public DepreciationReportDTO getReport() {
    Long orgId = loggedUser.getOrganizationId();
    List<Asset> assets = assetRepository.findByOrganizationIdWithDepreciation(orgId);

    List<DepreciationResultDTO> results =
        assets.stream()
            .filter(a -> a.getPurchaseValue() != null && a.getUsefulLifeMonths() != null)
            .map(a -> computeResult(a, LocalDate.now()))
            .collect(Collectors.toList());

    DepreciationReportDTO report = new DepreciationReportDTO();
    report.setItems(results);
    report.setGeneratedAt(LocalDate.now());
    report.setTotalAssets(results.size());
    return report;
  }

  // ════════════════════════════════════════════════════
  //  ENGINE DE CÁLCULO
  // ════════════════════════════════════════════════════

  private DepreciationResultDTO computeResult(Asset asset, LocalDate referenceDate) {
    BigDecimal purchaseValue = asset.getPurchaseValue();
    BigDecimal residualValue =
        asset.getResidualValue() != null ? asset.getResidualValue() : BigDecimal.ZERO;
    int usefulLifeMonths = asset.getUsefulLifeMonths();
    LocalDate purchaseDate =
        asset.getPurchaseDate() != null ? asset.getPurchaseDate() : LocalDate.now().minusMonths(1);
    DepreciationMethod method =
        asset.getDepreciationMethod() != null
            ? asset.getDepreciationMethod()
            : DepreciationMethod.LINEAR;

    long elapsedMonths = ChronoUnit.MONTHS.between(purchaseDate, referenceDate);
    elapsedMonths = Math.min(elapsedMonths, usefulLifeMonths);

    BigDecimal depreciableAmount = purchaseValue.subtract(residualValue);
    BigDecimal accumulated;

    switch (method) {
      case DECLINING_BALANCE ->
          accumulated =
              calculateDecliningBalance(
                  purchaseValue, residualValue, usefulLifeMonths, elapsedMonths);

      case SUM_OF_YEARS ->
          accumulated = calculateSumOfYears(depreciableAmount, usefulLifeMonths, elapsedMonths);

      default -> { // LINEAR
        BigDecimal monthlyQuota =
            depreciableAmount.divide(BigDecimal.valueOf(usefulLifeMonths), 6, RoundingMode.HALF_UP);
        accumulated =
            monthlyQuota
                .multiply(BigDecimal.valueOf(elapsedMonths))
                .setScale(2, RoundingMode.HALF_UP);
      }
    }

    // Não deprecia abaixo do valor residual
    accumulated = accumulated.min(depreciableAmount);
    BigDecimal currentValue = purchaseValue.subtract(accumulated);

    DepreciationResultDTO dto = new DepreciationResultDTO();
    dto.setAssetId(asset.getId());
    dto.setAssetTag(asset.getAssetTag());
    dto.setModel(asset.getModel());
    dto.setDepreciationMethod(method);
    dto.setPurchaseValue(purchaseValue);
    dto.setResidualValue(residualValue);
    dto.setCurrentValue(currentValue.setScale(2, RoundingMode.HALF_UP));
    dto.setAccumulatedDepreciation(accumulated);
    dto.setUsefulLifeMonths(usefulLifeMonths);
    dto.setElapsedMonths((int) elapsedMonths);
    dto.setRemainingMonths((int) Math.max(0, usefulLifeMonths - elapsedMonths));
    dto.setDepreciationPercentage(
        depreciableAmount.compareTo(BigDecimal.ZERO) > 0
            ? accumulated
                .divide(depreciableAmount, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
                .setScale(2, RoundingMode.HALF_UP)
            : BigDecimal.ZERO);
    dto.setFullyDepreciated(elapsedMonths >= usefulLifeMonths);
    dto.setCalculationDate(referenceDate);
    return dto;
  }

  /**
   * Saldo Decrescente (Double Declining Balance). Taxa = 2 / Vida Útil. Aplicada sobre o valor
   * contábil do período anterior.
   */
  private BigDecimal calculateDecliningBalance(
      BigDecimal purchaseValue,
      BigDecimal residualValue,
      int usefulLifeMonths,
      long elapsedMonths) {
    // Taxa anual = 2 / vida em anos; convertida para mensal
    double annualRate = 2.0 / (usefulLifeMonths / 12.0);
    double monthlyRate = annualRate / 12.0;

    BigDecimal currentValue = purchaseValue;
    BigDecimal accumulated = BigDecimal.ZERO;

    for (int i = 0; i < elapsedMonths; i++) {
      BigDecimal depreciation =
          currentValue.multiply(BigDecimal.valueOf(monthlyRate)).setScale(6, RoundingMode.HALF_UP);
      // Não deprecia abaixo do residual
      if (currentValue.subtract(depreciation).compareTo(residualValue) < 0) {
        depreciation = currentValue.subtract(residualValue);
      }
      accumulated = accumulated.add(depreciation);
      currentValue = currentValue.subtract(depreciation);
      if (currentValue.compareTo(residualValue) <= 0) break;
    }
    return accumulated.setScale(2, RoundingMode.HALF_UP);
  }

  /**
   * Soma dos Dígitos dos Anos (SYD — Sum of Years' Digits). SYD = n(n+1)/2 onde n = vida útil em
   * anos. Quota do período = (anos restantes / SYD) × valor depreciável.
   */
  private BigDecimal calculateSumOfYears(
      BigDecimal depreciableAmount, int usefulLifeMonths, long elapsedMonths) {
    // Converte para anos para o cálculo SYD clássico, mantém precisão mensal
    double usefulLifeYears = usefulLifeMonths / 12.0;
    double syd = usefulLifeYears * (usefulLifeYears + 1) / 2.0;

    BigDecimal accumulated = BigDecimal.ZERO;

    for (int month = 1; month <= elapsedMonths; month++) {
      double yearsRemaining = (usefulLifeMonths - month + 1) / 12.0;
      BigDecimal monthlyQuota =
          depreciableAmount
              .multiply(BigDecimal.valueOf(yearsRemaining / syd / 12.0))
              .setScale(6, RoundingMode.HALF_UP);
      accumulated = accumulated.add(monthlyQuota);
    }

    return accumulated.setScale(2, RoundingMode.HALF_UP);
  }

  // ─────────────────────────────────────────────
  //  Validation
  // ─────────────────────────────────────────────

  private void validateDepreciationFields(Asset asset) {
    if (asset.getPurchaseValue() == null) {
      throw new BusinessException(
          "Ativo sem valor de aquisição — configure purchaseValue para calcular depreciação");
    }
    if (asset.getUsefulLifeMonths() == null || asset.getUsefulLifeMonths() <= 0) {
      throw new BusinessException("Ativo sem vida útil definida — configure usefulLifeMonths");
    }
  }
}
