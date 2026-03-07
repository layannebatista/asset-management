package com.portfolio.assetmanagement.interfaces.rest.dashboard;

import com.portfolio.assetmanagement.application.dashboard.dto.DashboardData;
import com.portfolio.assetmanagement.application.dashboard.dto.ExecutiveDashboardDTO;
import com.portfolio.assetmanagement.application.dashboard.service.DashboardQueryService;
import com.portfolio.assetmanagement.application.dashboard.service.ExecutiveDashboardAssembler;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.*;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@Tag(
    name = "Dashboard - Executive",
    description = "Dashboard executivo com indicadores estratégicos da organização")
@RestController
@RequestMapping("/api/dashboard/executive")
public class ExecutiveDashboardController {

  private final DashboardQueryService dashboardQueryService;
  private final ExecutiveDashboardAssembler assembler;

  public ExecutiveDashboardController(
      DashboardQueryService dashboardQueryService, ExecutiveDashboardAssembler assembler) {

    this.dashboardQueryService = dashboardQueryService;
    this.assembler = assembler;
  }

  @Operation(
      summary = "Obter dashboard executivo",
      description =
          """
          Retorna indicadores estratégicos consolidados da organização atual.
          Inclui métricas como:
          - Total de ativos
          - Ativos disponíveis
          - Ativos atribuídos
          - Ativos em manutenção
          - Ativos aposentados
          - Indicadores agregados para visão gerencial
          Acesso exclusivo para usuários com perfil ADMIN.
          """)
  @ApiResponses({
    @ApiResponse(responseCode = "200", description = "Dashboard retornado com sucesso"),
    @ApiResponse(responseCode = "401", description = "Usuário não autenticado"),
    @ApiResponse(responseCode = "403", description = "Usuário sem permissão"),
    @ApiResponse(responseCode = "500", description = "Erro interno ao gerar dashboard")
  })
  @GetMapping
  @PreAuthorize("hasRole('ADMIN')")
  public ResponseEntity<ExecutiveDashboardDTO> getExecutiveDashboard() {

    DashboardData data = dashboardQueryService.loadDashboardData();

    ExecutiveDashboardDTO dto = assembler.assemble(data);

    return ResponseEntity.ok(dto);
  }
}
