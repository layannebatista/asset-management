package com.portfolio.assetmanagement.interfaces.rest.depreciation.controller;

import com.portfolio.assetmanagement.application.depreciation.dto.DepreciationReportDTO;
import com.portfolio.assetmanagement.application.depreciation.dto.DepreciationResultDTO;
import com.portfolio.assetmanagement.application.depreciation.dto.PortfolioValueDTO;
import com.portfolio.assetmanagement.application.depreciation.service.DepreciationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Endpoints de depreciação e valoração de portfólio.
 *
 * <p>Relevante para instituições financeiras, seguradoras e empresas que seguem CPC 27 / IAS 16 /
 * IFRS para controle patrimonial.
 */
@Tag(
    name = "Depreciation",
    description =
        """
    Cálculo de depreciação patrimonial (Linear, Saldo Decrescente, SYD)
    e valoração de portfólio. Padrão CPC 27 / IAS 16 / IFRS.
    """)
@RestController
@RequestMapping("/assets")
public class DepreciationController {

  private final DepreciationService depreciationService;

  public DepreciationController(DepreciationService depreciationService) {
    this.depreciationService = depreciationService;
  }

  @Operation(
      summary = "Calcular depreciação de um ativo",
      description =
          """
      Retorna o valor contábil atual, depreciação acumulada e percentual depreciado
      para o ativo informado, usando o método configurado no cadastro do ativo.

      **Métodos suportados:**
      - `LINEAR` — quota constante (CPC 27)
      - `DECLINING_BALANCE` — saldo decrescente com taxa dobrada (IFRS)
      - `SUM_OF_YEARS` — soma dos dígitos dos anos (acelerado para TI/veículos)

      O ativo deve ter `purchaseValue`, `usefulLifeMonths` e `purchaseDate` configurados.
      """)
  @GetMapping("/{id}/depreciation")
  public ResponseEntity<DepreciationResultDTO> calculate(
      @Parameter(description = "ID do ativo") @PathVariable Long id) {
    return ResponseEntity.ok(depreciationService.calculate(id));
  }

  @Operation(
      summary = "Valoração do portfólio da organização",
      description =
          """
      Retorna o valor total do patrimônio considerando depreciação acumulada.
      Inclui: valor original total, valor atual depreciado, % depreciado.

      Disponível apenas para ADMIN.
      """)
  @GetMapping("/depreciation/portfolio")
  @PreAuthorize("hasRole('ADMIN')")
  public ResponseEntity<PortfolioValueDTO> portfolio() {
    return ResponseEntity.ok(depreciationService.getPortfolioValue());
  }

  @Operation(
      summary = "Relatório de depreciação por ativo",
      description =
          """
      Retorna a depreciação calculada para todos os ativos configurados
      na organização, com detalhamento por método e período.
      """)
  @GetMapping("/depreciation/report")
  @PreAuthorize("hasAnyRole('ADMIN','GESTOR')")
  public ResponseEntity<DepreciationReportDTO> report() {
    return ResponseEntity.ok(depreciationService.getReport());
  }
}
