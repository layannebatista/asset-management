package com.portfolio.assetmanagement.service.dashboard;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import com.portfolio.assetmanagement.application.dashboard.service.DashboardQueryService;
import com.portfolio.assetmanagement.infrastructure.persistence.dashboard.repository.DashboardQueryRepository;
import com.portfolio.assetmanagement.security.context.LoggedUserContext;
import com.portfolio.assetmanagement.shared.exception.BusinessException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
@DisplayName("DashboardQueryService — segurança")
@Tag("testType=Integration")
@Tag("module=Dashboard")
class DashboardQueryServiceTest {

  @Mock private DashboardQueryRepository repository;
  @Mock private LoggedUserContext loggedUserContext;

  @InjectMocks private DashboardQueryService service;

  @Test
  @DisplayName("[INTEGRACAO][ASSET] DASH-S01 - gestor sem unidade recebe BusinessException")
  void gestorSemUnidadeRecebeBusinessException() {
    when(loggedUserContext.isAdmin()).thenReturn(false);
    when(loggedUserContext.isManager()).thenReturn(true);
    when(loggedUserContext.getUnitId()).thenReturn(null);

    assertThatThrownBy(service::loadDashboardData)
        .isInstanceOf(BusinessException.class)
        .hasMessageContaining("não possui unidade associada");
  }
}
