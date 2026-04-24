package com.portfolio.assetmanagement.service.organization;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.portfolio.assetmanagement.application.audit.service.AuditService;
import com.portfolio.assetmanagement.application.organization.service.OrganizationService;
import com.portfolio.assetmanagement.application.unit.service.UnitService;
import com.portfolio.assetmanagement.domain.organization.entity.Organization;
import com.portfolio.assetmanagement.infrastructure.persistence.organization.repository.OrganizationRepository;
import com.portfolio.assetmanagement.shared.exception.BusinessException;
import com.portfolio.assetmanagement.shared.exception.NotFoundException;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.Tag;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
@DisplayName("OrganizationService — regras críticas")
@Tag("testType=Integration")
@Tag("module=Organization")
class OrganizationServiceTest {

  @Mock private OrganizationRepository organizationRepository;
  @Mock private UnitService unitService;
  @Mock private AuditService auditService;

  @InjectMocks private OrganizationService service;

  @Test
  @DisplayName("ORG-S01 - create com nome em branco lança BusinessException")
  void createNomeEmBrancoLancaBusinessException() {
    assertThatThrownBy(() -> service.createOrganization("   "))
        .isInstanceOf(BusinessException.class)
        .hasMessageContaining("Nome da organização é obrigatório");

    verify(organizationRepository, never()).save(org.mockito.ArgumentMatchers.any());
  }

  @Test
  @DisplayName("ORG-S02 - findById inexistente lança NotFoundException")
  void findByIdInexistenteLancaNotFound() {
    when(organizationRepository.findById(77L)).thenReturn(Optional.empty());

    assertThatThrownBy(() -> service.findById(77L))
        .isInstanceOf(NotFoundException.class)
        .hasMessageContaining("Organização não encontrada");
  }

  @Test
  @DisplayName("ORG-S03 - inactivate já inativa lança BusinessException")
  void inactivateJaInativaLancaBusinessException() {
    Organization org = new Organization("Acme");
    org.setStatus(com.portfolio.assetmanagement.domain.organization.enums.OrganizationStatus.INACTIVE);
    when(organizationRepository.findById(1L)).thenReturn(Optional.of(org));

    assertThatThrownBy(() -> service.inactivateOrganization(1L))
        .isInstanceOf(BusinessException.class)
        .hasMessageContaining("já está inativa");
  }
}
