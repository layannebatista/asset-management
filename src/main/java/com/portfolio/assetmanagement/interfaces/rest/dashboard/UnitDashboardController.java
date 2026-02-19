package com.portfolio.assetmanagement.interfaces.rest.dashboard;

import com.portfolio.assetmanagement.application.dashboard.dto.DashboardData;
import com.portfolio.assetmanagement.application.dashboard.dto.UnitDashboardDTO;
import com.portfolio.assetmanagement.application.dashboard.service.DashboardQueryService;
import com.portfolio.assetmanagement.application.dashboard.service.UnitDashboardAssembler;
import com.portfolio.assetmanagement.security.context.LoggedUserContext;
import com.portfolio.assetmanagement.shared.exception.UnauthorizedException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
