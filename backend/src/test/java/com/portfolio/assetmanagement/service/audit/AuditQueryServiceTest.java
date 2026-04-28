package com.portfolio.assetmanagement.service.audit;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import com.portfolio.assetmanagement.application.audit.service.AuditIntegrityService;
import com.portfolio.assetmanagement.application.audit.service.AuditQueryService;
import com.portfolio.assetmanagement.infrastructure.persistence.audit.repository.AuditEventRepository;
import com.portfolio.assetmanagement.security.context.LoggedUserContext;
import com.portfolio.assetmanagement.shared.exception.ForbiddenException;
import com.portfolio.assetmanagement.shared.exception.ValidationException;
import java.time.OffsetDateTime;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuditQueryService — segurança e validações")
@Tag("testType=Integration")
@Tag("module=Audit")
class AuditQueryServiceTest {

  @Mock private AuditEventRepository repository;
  @Mock private AuditIntegrityService integrityService;
  @Mock private LoggedUserContext loggedUser;

  @InjectMocks private AuditQueryService service;

  @Test
  @DisplayName(
      "[INTEGRACAO][ASSET] AUD-S01 - usuário não ADMIN sem acesso à organização recebe Forbidden")
  void semAcessoOrganizacaoRecebeForbidden() {
    when(loggedUser.isAdmin()).thenReturn(false);
    when(loggedUser.getOrganizationId()).thenReturn(10L);

    assertThatThrownBy(() -> service.findByOrganization(99L))
        .isInstanceOf(ForbiddenException.class)
        .hasMessageContaining("Acesso negado");
  }

  @Test
  @DisplayName("[INTEGRACAO][ASSET] AUD-S02 - período inválido gera ValidationException")
  void periodoInvalidoGeraValidationException() {
    when(loggedUser.isAdmin()).thenReturn(true);

    assertThatThrownBy(
            () -> service.findByPeriod(1L, OffsetDateTime.now(), OffsetDateTime.now().minusDays(1)))
        .isInstanceOf(ValidationException.class)
        .hasMessageContaining("Período inválido");
  }
}
