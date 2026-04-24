package com.portfolio.assetmanagement.service.transfer;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.portfolio.assetmanagement.application.transfer.service.TransferQueryService;
import com.portfolio.assetmanagement.domain.transfer.entity.TransferRequest;
import com.portfolio.assetmanagement.domain.transfer.enums.TransferStatus;
import com.portfolio.assetmanagement.infrastructure.persistence.transfer.repository.TransferRepository;
import com.portfolio.assetmanagement.security.context.LoggedUserContext;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import io.qameta.allure.Severity;
import io.qameta.allure.SeverityLevel;
import io.qameta.allure.Story;
import java.time.LocalDate;
import java.util.Collections;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@Epic("Backend")
@Feature("Serviços — Transfer")
@Story("Consulta")
@DisplayName("TransferQueryService")
@Tag("testType=Integration")
@Tag("module=Transfer")
class TransferQueryServiceTest {

  @Mock private TransferRepository repository;
  @Mock private LoggedUserContext loggedUser;

  @Test
  @Severity(SeverityLevel.NORMAL)
  @DisplayName("TS17 - ADMIN lista transferências com filtros e paginação")
  void ts17AdminListaTransferenciasComFiltrosEPaginacao() {
    TransferQueryService service = new TransferQueryService(repository, loggedUser);
    Pageable pageable = PageRequest.of(0, 10);
    Page<TransferRequest> page = new PageImpl<>(Collections.emptyList(), pageable, 0);
    when(repository.findAll(any(Specification.class), eq(pageable))).thenReturn(page);
    when(loggedUser.isManager()).thenReturn(false);

    Page<TransferRequest> result =
        service.list(TransferStatus.PENDING, 100L, 20L, LocalDate.now(), LocalDate.now(), pageable);

    assertThat(result).isSameAs(page);
    verify(repository).findAll(any(Specification.class), eq(pageable));
  }

  @Test
  @Severity(SeverityLevel.CRITICAL)
  @DisplayName("TS18 - GESTOR usa escopo da própria unidade independentemente do filtro recebido")
  void ts18GestorUsaEscopoDaPropriaUnidadeIndependentementeDoFiltroRecebido() {
    TransferQueryService service = new TransferQueryService(repository, loggedUser);
    Pageable pageable = PageRequest.of(0, 10);
    Page<TransferRequest> page = new PageImpl<>(Collections.emptyList(), pageable, 0);
    when(repository.findAll(any(Specification.class), eq(pageable))).thenReturn(page);
    when(loggedUser.isManager()).thenReturn(true);
    when(loggedUser.getUnitId()).thenReturn(10L);

    Page<TransferRequest> result = service.list(null, null, 999L, null, null, pageable);

    assertThat(result).isSameAs(page);
    verify(repository).findAll(any(Specification.class), eq(pageable));
  }
}

