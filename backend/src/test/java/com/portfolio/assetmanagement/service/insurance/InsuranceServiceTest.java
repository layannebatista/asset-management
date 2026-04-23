package com.portfolio.assetmanagement.service.insurance;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.portfolio.assetmanagement.application.insurance.dto.InsuranceCreateDTO;
import com.portfolio.assetmanagement.application.insurance.service.InsuranceService;
import com.portfolio.assetmanagement.application.whatsapp.service.WhatsAppService;
import com.portfolio.assetmanagement.domain.insurance.entity.AssetInsurance;
import com.portfolio.assetmanagement.infrastructure.persistence.asset.repository.AssetRepository;
import com.portfolio.assetmanagement.infrastructure.persistence.insurance.repository.InsuranceRepository;
import com.portfolio.assetmanagement.infrastructure.persistence.user.repository.UserRepository;
import com.portfolio.assetmanagement.security.context.LoggedUserContext;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
@DisplayName("InsuranceService — regras críticas")
class InsuranceServiceTest {

  @Mock private InsuranceRepository insuranceRepository;
  @Mock private AssetRepository assetRepository;
  @Mock private UserRepository userRepository;
  @Mock private WhatsAppService whatsAppService;
  @Mock private LoggedUserContext loggedUser;

  @InjectMocks private InsuranceService service;

  @Test
  @DisplayName("INS-S01 - nova apólice desativa apólice anterior ativa")
  void novaApoliceDesativaAnteriorAtiva() {
    Long assetId = 10L;

    com.portfolio.assetmanagement.domain.organization.entity.Organization organization =
        org.mockito.Mockito.mock(
            com.portfolio.assetmanagement.domain.organization.entity.Organization.class);
    when(organization.getId()).thenReturn(1L);
    com.portfolio.assetmanagement.domain.unit.entity.Unit unit =
        new com.portfolio.assetmanagement.domain.unit.entity.Unit("Sede", organization, true);
    com.portfolio.assetmanagement.domain.asset.entity.Asset asset =
        new com.portfolio.assetmanagement.domain.asset.entity.Asset(
            "AST-001",
            com.portfolio.assetmanagement.domain.asset.enums.AssetType.NOTEBOOK,
            "Modelo",
            organization,
            unit);

    when(assetRepository.findById(assetId)).thenReturn(Optional.of(asset));
    AssetInsurance old =
        new AssetInsurance(
            assetId,
            1L,
            "OLD-1",
            "Seg A",
            new BigDecimal("1000"),
            new BigDecimal("100"),
            LocalDate.now().minusDays(20),
            LocalDate.now().plusDays(10));
    when(insuranceRepository.findByAssetIdAndActiveTrue(assetId)).thenReturn(Optional.of(old));
    when(loggedUser.getOrganizationId()).thenReturn(1L);
    when(insuranceRepository.save(any(AssetInsurance.class)))
        .thenAnswer(invocation -> invocation.getArgument(0));

    InsuranceCreateDTO dto = new InsuranceCreateDTO();
    dto.setPolicyNumber("NEW-1");
    dto.setInsurer("Seg B");
    dto.setCoverageValue(new BigDecimal("2000"));
    dto.setPremium(new BigDecimal("150"));
    dto.setStartDate(LocalDate.now());
    dto.setExpiryDate(LocalDate.now().plusDays(60));

    AssetInsurance created = service.register(assetId, dto);

    assertThat(old.isActive()).isFalse();
    assertThat(created.getPolicyNumber()).isEqualTo("NEW-1");
    verify(insuranceRepository).save(old);
  }

}
