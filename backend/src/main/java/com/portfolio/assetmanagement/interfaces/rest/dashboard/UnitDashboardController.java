package com.portfolio.assetmanagement.interfaces.rest.dashboard;

import com.portfolio.assetmanagement.application.dashboard.dto.DashboardData;
import com.portfolio.assetmanagement.application.dashboard.dto.UnitDashboardDTO;
import com.portfolio.assetmanagement.application.dashboard.service.DashboardQueryService;
import com.portfolio.assetmanagement.application.dashboard.service.UnitDashboardAssembler;
import com.portfolio.assetmanagement.security.context.LoggedUserContext;
import com.portfolio.assetmanagement.shared.exception.UnauthorizedException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.*;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Dashboard - Unit", description = "Dashboard gerencial da unidade organizacional")
@RestController
@RequestMapping("/api/dashboard/unit")
public class UnitDashboardController {

  private final DashboardQueryService dashboardQueryService;
  private final UnitDashboardAssembler assembler;
  private final LoggedUserContext loggedUserContext;

  public UnitDashboardController(
      DashboardQueryService dashboardQueryService,
      UnitDashboardAssembler assembler,
      LoggedUserContext loggedUserContext) {

    this.dashboardQueryService = dashboardQueryService;
    this.assembler = assembler;
    this.loggedUserContext = loggedUserContext;
  }

  @Operation(
      summary = "Obter dashboard da unidade",
      description =
          """
          Retorna indicadores gerenciais relacionados à unidade organizacional
          do usuário autenticado.

          Inclui métricas como:
          - Total de ativos da unidade
          - Ativos disponíveis
          - Ativos atribuídos
          - Ativos em manutenção
          - Distribuição por status

          Acesso exclusivo para perfil MANAGER.
          """)
  @ApiResponses({
    @ApiResponse(responseCode = "200", description = "Dashboard retornado com sucesso"),
    @ApiResponse(responseCode = "401", description = "Usuário não autenticado"),
    @ApiResponse(responseCode = "403", description = "Usuário sem permissão"),
    @ApiResponse(responseCode = "500", description = "Erro interno ao gerar dashboard")
  })
  @GetMapping
  public ResponseEntity<UnitDashboardDTO> getUnitDashboard() {

    if (!loggedUserContext.isManager()) {
      throw new UnauthorizedException("Acesso restrito ao perfil MANAGER");
    }

    DashboardData data = dashboardQueryService.loadDashboardData();

    UnitDashboardDTO dto = assembler.assemble(data);

    return ResponseEntity.ok(dto);
  }
}
