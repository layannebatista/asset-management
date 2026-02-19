package com.portfolio.assetmanagement.interfaces.rest.dashboard;

import com.portfolio.assetmanagement.application.dashboard.dto.DashboardData;
import com.portfolio.assetmanagement.application.dashboard.dto.ExecutiveDashboardDTO;
import com.portfolio.assetmanagement.application.dashboard.service.DashboardQueryService;
import com.portfolio.assetmanagement.application.dashboard.service.ExecutiveDashboardAssembler;
import com.portfolio.assetmanagement.security.context.LoggedUserContext;
import com.portfolio.assetmanagement.shared.exception.UnauthorizedException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dashboard/executive")
public class ExecutiveDashboardController {

  private final DashboardQueryService dashboardQueryService;
  private final ExecutiveDashboardAssembler assembler;
  private final LoggedUserContext loggedUserContext;

  public ExecutiveDashboardController(
      DashboardQueryService dashboardQueryService,
      ExecutiveDashboardAssembler assembler,
      LoggedUserContext loggedUserContext) {

    this.dashboardQueryService = dashboardQueryService;
    this.assembler = assembler;
    this.loggedUserContext = loggedUserContext;
  }

  @GetMapping
  public ResponseEntity<ExecutiveDashboardDTO> getExecutiveDashboard() {

    // Segurança adicional: apenas ADMIN pode acessar dashboard executivo
    if (!loggedUserContext.isAdmin()) {
      throw new UnauthorizedException("Acesso restrito ao perfil ADMIN");
    }

    DashboardData data = dashboardQueryService.loadDashboardData();

    ExecutiveDashboardDTO dto = assembler.assemble(data);

    return ResponseEntity.ok(dto);
  }
}
