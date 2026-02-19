package com.portfolio.assetmanagement.interfaces.rest.dashboard;

import com.portfolio.assetmanagement.application.dashboard.dto.DashboardData;
import com.portfolio.assetmanagement.application.dashboard.dto.PersonalDashboardDTO;
import com.portfolio.assetmanagement.application.dashboard.service.DashboardQueryService;
import com.portfolio.assetmanagement.application.dashboard.service.PersonalDashboardAssembler;
import com.portfolio.assetmanagement.security.context.LoggedUserContext;
import com.portfolio.assetmanagement.shared.exception.UnauthorizedException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dashboard/personal")
public class PersonalDashboardController {

  private final DashboardQueryService dashboardQueryService;
  private final PersonalDashboardAssembler assembler;
  private final LoggedUserContext loggedUserContext;

  public PersonalDashboardController(
      DashboardQueryService dashboardQueryService,
      PersonalDashboardAssembler assembler,
      LoggedUserContext loggedUserContext) {

    this.dashboardQueryService = dashboardQueryService;
    this.assembler = assembler;
    this.loggedUserContext = loggedUserContext;
  }

  @GetMapping
  public ResponseEntity<PersonalDashboardDTO> getPersonalDashboard() {

    if (!loggedUserContext.isOperator()) {
      throw new UnauthorizedException("Acesso restrito ao perfil OPERATOR");
    }

    DashboardData data = dashboardQueryService.loadDashboardData();

    PersonalDashboardDTO dto = assembler.assemble(data);

    return ResponseEntity.ok(dto);
  }
}
