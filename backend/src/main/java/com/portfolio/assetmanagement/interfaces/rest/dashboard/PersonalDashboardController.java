package com.portfolio.assetmanagement.interfaces.rest.dashboard;

import com.portfolio.assetmanagement.application.dashboard.dto.DashboardData;
import com.portfolio.assetmanagement.application.dashboard.dto.PersonalDashboardDTO;
import com.portfolio.assetmanagement.application.dashboard.service.DashboardQueryService;
import com.portfolio.assetmanagement.application.dashboard.service.PersonalDashboardAssembler;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.*;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Dashboard - Personal", description = "Dashboard operacional individual do usuário")
@RestController
@RequestMapping("/api/dashboard/personal")
public class PersonalDashboardController {

  private final DashboardQueryService dashboardQueryService;
  private final PersonalDashboardAssembler assembler;

  // CORRIGIDO: LoggedUserContext removido — não é mais necessário após migrar para @PreAuthorize.
  public PersonalDashboardController(
      DashboardQueryService dashboardQueryService, PersonalDashboardAssembler assembler) {

    this.dashboardQueryService = dashboardQueryService;
    this.assembler = assembler;
  }

  @Operation(
      summary = "Obter dashboard pessoal",
      description =
          """
          Retorna indicadores operacionais relacionados ao usuário autenticado.

          Inclui informações como:
          - Ativos atribuídos ao usuário
          - Status atuais
          - Indicadores operacionais pessoais

          Acesso exclusivo para perfil OPERADOR.
          """)
  @ApiResponses({
    @ApiResponse(responseCode = "200", description = "Dashboard retornado com sucesso"),
    @ApiResponse(responseCode = "401", description = "Usuário não autenticado"),
    @ApiResponse(responseCode = "403", description = "Usuário sem permissão"),
    @ApiResponse(responseCode = "500", description = "Erro interno ao gerar dashboard")
  })
  // CORRIGIDO: era verificação manual com if/throw UnauthorizedException (HTTP 401).
  // @PreAuthorize retorna HTTP 403, que é o código semanticamente correto para acesso negado.
  @PreAuthorize("hasRole('OPERADOR')")
  @GetMapping
  public ResponseEntity<PersonalDashboardDTO> getPersonalDashboard() {

    DashboardData data = dashboardQueryService.loadDashboardData();

    PersonalDashboardDTO dto = assembler.assemble(data);

    return ResponseEntity.ok(dto);
  }
}
