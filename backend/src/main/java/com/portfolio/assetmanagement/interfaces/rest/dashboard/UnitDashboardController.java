package com.portfolio.assetmanagement.interfaces.rest.dashboard;

import com.portfolio.assetmanagement.application.dashboard.dto.DashboardData;
import com.portfolio.assetmanagement.application.dashboard.dto.UnitDashboardDTO;
import com.portfolio.assetmanagement.application.dashboard.service.DashboardQueryService;
import com.portfolio.assetmanagement.application.dashboard.service.UnitDashboardAssembler;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.*;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Dashboard - Unit", description = "Dashboard gerencial da unidade organizacional")
@RestController
@RequestMapping("/api/dashboard/unit")
public class UnitDashboardController {

  private final DashboardQueryService dashboardQueryService;
  private final UnitDashboardAssembler assembler;

  // CORRIGIDO: LoggedUserContext removido — não é mais necessário após migrar para @PreAuthorize.
  public UnitDashboardController(
      DashboardQueryService dashboardQueryService, UnitDashboardAssembler assembler) {

    this.dashboardQueryService = dashboardQueryService;
    this.assembler = assembler;
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

          Acesso exclusivo para perfil GESTOR.
          """)
  @ApiResponses({
    @ApiResponse(responseCode = "200", description = "Dashboard retornado com sucesso"),
    @ApiResponse(responseCode = "401", description = "Usuário não autenticado"),
    @ApiResponse(responseCode = "403", description = "Usuário sem permissão"),
    @ApiResponse(responseCode = "500", description = "Erro interno ao gerar dashboard")
  })
  // CORRIGIDO: era verificação manual com if/throw UnauthorizedException (HTTP 401).
  // @PreAuthorize retorna HTTP 403, que é o código semanticamente correto para acesso negado.
  @PreAuthorize("hasRole('GESTOR')")
  @GetMapping
  public ResponseEntity<UnitDashboardDTO> getUnitDashboard() {

    DashboardData data = dashboardQueryService.loadDashboardData();

    UnitDashboardDTO dto = assembler.assemble(data);

    return ResponseEntity.ok(dto);
  }
}
