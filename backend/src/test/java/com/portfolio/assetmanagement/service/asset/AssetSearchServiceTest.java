package com.portfolio.assetmanagement.service.asset;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.portfolio.assetmanagement.application.asset.dto.AssetResponseDTO;
import com.portfolio.assetmanagement.application.asset.mapper.AssetMapper;
import com.portfolio.assetmanagement.application.asset.service.AssetAssignmentHistoryService;
import com.portfolio.assetmanagement.application.asset.service.AssetNumberGeneratorService;
import com.portfolio.assetmanagement.application.asset.service.AssetService;
import com.portfolio.assetmanagement.application.asset.service.AssetStatusService;
import com.portfolio.assetmanagement.application.asset.service.AssetValidationService;
import com.portfolio.assetmanagement.application.audit.service.AuditService;
import com.portfolio.assetmanagement.domain.asset.entity.Asset;
import com.portfolio.assetmanagement.infrastructure.persistence.asset.repository.AssetRepository;
import com.portfolio.assetmanagement.infrastructure.persistence.user.repository.UserRepository;
import com.portfolio.assetmanagement.security.context.LoggedUserContext;
import com.portfolio.assetmanagement.shared.pagination.PageResponse;
import com.portfolio.assetmanagement.shared.specification.AssetSpecificationBuilder.AssetSpecification;
import com.portfolio.assetmanagement.shared.specification.FilterCriteria;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("AssetService — Busca e escopo")
class AssetSearchServiceTest {

  @Mock private AssetRepository repository;
  @Mock private LoggedUserContext loggedUser;
  @Mock private AssetAssignmentHistoryService assignmentHistoryService;
  @Mock private UserRepository userRepository;
  @Mock private AssetValidationService validationService;
  @Mock private AssetStatusService statusService;
  @Mock private AssetNumberGeneratorService numberGeneratorService;
  @Mock private AssetMapper assetMapper;
  @Mock private AuditService auditService;

  private AssetService service;

  @BeforeEach
  void setUp() {
    service =
        new AssetService(
            repository,
            loggedUser,
            assignmentHistoryService,
            userRepository,
            validationService,
            statusService,
            numberGeneratorService,
            assetMapper,
            auditService);
  }

  @Test
  @DisplayName("AS01 - ADMIN pode filtrar por qualquer unidade no searchAssets")
  void as01AdminPodeFiltrarPorQualquerUnidade() {
    Pageable pageable = PageRequest.of(0, 10);
    Asset asset = org.mockito.Mockito.mock(Asset.class);

    when(loggedUser.isAdmin()).thenReturn(true);
    when(loggedUser.getOrganizationId()).thenReturn(10L);

    when(repository.findAll(any(Specification.class), eq(pageable)))
        .thenReturn(new PageImpl<>(List.of(asset), pageable, 1));
    when(assetMapper.toResponseDTO(asset))
        .thenReturn(new AssetResponseDTO(1L, "ASSET-1", null, "Modelo", null, 10L, 30L, null));

    service.searchAssets(null, null, 30L, null, null, null, null, pageable);

    ArgumentCaptor<AssetSpecification> captor = ArgumentCaptor.forClass(AssetSpecification.class);
    verify(repository).findAll(captor.capture(), eq(pageable));

    Map<String, Object> criteria = toCriteriaMap(captor.getValue().getCriteriaList());
    assertThat(criteria).containsEntry("organizationId", 10L);
    assertThat(criteria).containsEntry("unitId", 30L);
  }

  @Test
  @DisplayName("AS02 - ADMIN sem unitId — organizationId incluído, unitId ausente")
  void as02AdminSemUnitIdOrganizationIdSempNaSpec() {
    Pageable pageable = PageRequest.of(0, 10);
    Asset asset = org.mockito.Mockito.mock(Asset.class);

    when(loggedUser.isAdmin()).thenReturn(true);
    when(loggedUser.getOrganizationId()).thenReturn(10L);

    when(repository.findAll(any(Specification.class), eq(pageable)))
        .thenReturn(new PageImpl<>(List.of(asset), pageable, 1));
    when(assetMapper.toResponseDTO(asset))
        .thenReturn(new AssetResponseDTO(1L, "ASSET-2", null, "Modelo", null, 10L, null, null));

    service.searchAssets(null, null, null, null, null, null, null, pageable);

    ArgumentCaptor<AssetSpecification> captor = ArgumentCaptor.forClass(AssetSpecification.class);
    verify(repository).findAll(captor.capture(), eq(pageable));

    Map<String, Object> criteria = toCriteriaMap(captor.getValue().getCriteriaList());
    assertThat(criteria).containsEntry("organizationId", 10L);
    assertThat(criteria).doesNotContainKey("unitId");
  }

  @Test
  @DisplayName("AS03 - searchAssets de GESTOR deve filtrar pela unidade do próprio gestor")
  void as03SearchAssetsGestorDeveFiltrarPorUnidadeDoGestor() {
    Pageable pageable = PageRequest.of(0, 10);
    Asset asset = org.mockito.Mockito.mock(Asset.class);

    when(loggedUser.isAdmin()).thenReturn(false);
    when(loggedUser.isManager()).thenReturn(true);
    when(loggedUser.getOrganizationId()).thenReturn(10L);
    when(loggedUser.getUnitId()).thenReturn(20L);

    when(repository.findAll(any(Specification.class), eq(pageable)))
        .thenReturn(new PageImpl<>(List.of(asset), pageable, 1));
    when(assetMapper.toResponseDTO(asset))
        .thenReturn(new AssetResponseDTO(1L, "ASSET-1", null, "Modelo", null, 10L, 20L, null));

    PageResponse<AssetResponseDTO> result =
        service.searchAssets(null, null, 999L, null, null, null, null, pageable);

    ArgumentCaptor<AssetSpecification> captor = ArgumentCaptor.forClass(AssetSpecification.class);
    verify(repository).findAll(captor.capture(), eq(pageable));

    Map<String, Object> criteria = toCriteriaMap(captor.getValue().getCriteriaList());
    assertThat(criteria).containsEntry("organizationId", 10L);
    assertThat(criteria).containsEntry("unitId", 20L);
    assertThat(criteria).doesNotContainEntry("unitId", 999L);
    assertThat(result.getContent()).hasSize(1);
  }

  @Test
  @DisplayName("AS04 - searchAssets de OPERADOR deve filtrar pelos ativos do próprio usuário")
  void as04SearchAssetsOperadorDeveFiltrarPorUsuarioLogado() {
    Pageable pageable = PageRequest.of(0, 10);
    Asset asset = org.mockito.Mockito.mock(Asset.class);

    when(loggedUser.isAdmin()).thenReturn(false);
    when(loggedUser.isManager()).thenReturn(false);
    when(loggedUser.getOrganizationId()).thenReturn(10L);
    when(loggedUser.getUserId()).thenReturn(77L);

    when(repository.findAll(any(Specification.class), eq(pageable)))
        .thenReturn(new PageImpl<>(List.of(asset), pageable, 1));
    when(assetMapper.toResponseDTO(asset))
        .thenReturn(new AssetResponseDTO(2L, "ASSET-2", null, "Modelo", null, 10L, 20L, 77L));

    PageResponse<AssetResponseDTO> result =
        service.searchAssets(null, null, 55L, 88L, null, null, null, pageable);

    ArgumentCaptor<AssetSpecification> captor = ArgumentCaptor.forClass(AssetSpecification.class);
    verify(repository).findAll(captor.capture(), eq(pageable));

    Map<String, Object> criteria = toCriteriaMap(captor.getValue().getCriteriaList());
    assertThat(criteria).containsEntry("organizationId", 10L);
    assertThat(criteria).containsEntry("assignedUserId", 77L);
    assertThat(criteria).doesNotContainKey("unitId");
    assertThat(criteria).doesNotContainEntry("assignedUserId", 88L);
    assertThat(result.getContent()).hasSize(1);
  }

  private Map<String, Object> toCriteriaMap(List<FilterCriteria> criteriaList) {
    return criteriaList.stream()
        .collect(Collectors.toMap(FilterCriteria::getKey, FilterCriteria::getValue));
  }
}

