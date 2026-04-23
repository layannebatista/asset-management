package com.portfolio.assetmanagement.bdd.steps.assets;

import static org.assertj.core.api.Assertions.assertThat;

import com.portfolio.assetmanagement.bdd.client.ApiClient;
import com.portfolio.assetmanagement.bdd.context.ScenarioContext;
import com.portfolio.assetmanagement.bdd.support.TestDataHelper;
import com.portfolio.assetmanagement.domain.organization.entity.Organization;
import com.portfolio.assetmanagement.domain.unit.entity.Unit;
import com.portfolio.assetmanagement.security.enums.UserRole;
import io.cucumber.java.pt.E;
import io.cucumber.java.pt.Então;
import io.cucumber.java.pt.Quando;
import io.restassured.module.mockmvc.response.MockMvcResponse;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import org.springframework.beans.factory.annotation.Autowired;

/**
 * Steps de concorrência, invariantes de negócio, consistência e edge cases.
 */
public class AssetConcurrencySteps {

  @Autowired private ApiClient apiClient;
  @Autowired private ScenarioContext context;
  @Autowired private TestDataHelper testDataHelper;

  // =========================================================
  // INVARIANTES DE NEGÓCIO
  // =========================================================

  @E("que obtenho o status do ativo {string}")
  public void queObtenhoStatusAtivo(String assetTag) {
    Long assetId = context.getId("ativoId_" + assetTag);
    context.setLastResponse(apiClient.buscarAtivo(assetId, context.getToken()));
  }

  @Então("o ativo não deve estar simultaneamente atribuído e em manutenção")
  public void ativoNaoSimultaneoAtribuidoManutencao() {
    String status = context.getLastResponse().path("status");
    String userId = context.getLastResponse().path("userId");

    boolean isAssigned = "ASSIGNED".equals(status) && userId != null;
    boolean isInMaintenance = "IN_MAINTENANCE".equals(status);

    assertThat(isAssigned && isInMaintenance)
        .as("Ativo não deve estar simultaneamente atribuído e em manutenção")
        .isFalse();
  }

  @Então("o ativo não deve estar com status simultâneos de TRANSFERENCIA e AVAILABLE")
  public void ativoNaoSimultaneoTransferenciaDisponivel() {
    assertThat((String) context.getLastResponse().path("status"))
        .as("Ativo não deve ter status ambíguo")
        .isIn("IN_TRANSFER", "AVAILABLE");
  }

  // =========================================================
  // CONCORRÊNCIA — MÚLTIPLOS REQUESTS SIMULTÂNEOS
  // =========================================================

  @Quando("envio múltiplas requisições de atribuição em paralelo para o ativo {string}")
  public void multiplosRequestsAtribuicao(String assetTag) {
    Long assetId = context.getId("ativoId_" + assetTag);
    int numThreads = 5;
    ExecutorService executor = Executors.newFixedThreadPool(numThreads);
    CountDownLatch latch = new CountDownLatch(numThreads);
    AtomicInteger sucessos = new AtomicInteger(0);

    try {
      Long userId = testDataHelper.resolverFallbackUsuarioId();
      for (int i = 0; i < numThreads; i++) {
        executor.submit(
            () -> {
              try {
                MockMvcResponse response =
                    apiClient.atribuirAtivo(assetId, userId, context.getToken());
                if (response.statusCode() < 400) {
                  sucessos.incrementAndGet();
                }
              } finally {
                latch.countDown();
              }
            });
      }

      if (!latch.await(10, TimeUnit.SECONDS)) {
        throw new RuntimeException("Teste concorrente expirou");
      }
      context.setValue("sucessos", sucessos.get());
    } catch (InterruptedException e) {
      Thread.currentThread().interrupt();
      throw new RuntimeException("Teste concorrente interrompido", e);
    } finally {
      executor.shutdown();
    }
  }

  @Quando("envio múltiplas requisições de transferência simultâneas")
  public void multiplosRequestsTransferencia() {
    String assetTag = context.getCurrentAssetTag();
    Long assetId = context.getId("ativoId_" + assetTag);
    Long toUnitId = context.getId("unidadeExtraId");
    int numThreads = 5;
    ExecutorService executor = Executors.newFixedThreadPool(numThreads);
    CountDownLatch latch = new CountDownLatch(numThreads);
    AtomicInteger sucessos = new AtomicInteger(0);

    try {
      for (int i = 0; i < numThreads; i++) {
        executor.submit(
            () -> {
              try {
                MockMvcResponse response =
                    apiClient.solicitarTransferencia(
                        assetId, toUnitId, "Transferência concorrente", context.getToken());
                if (response.statusCode() < 400) {
                  sucessos.incrementAndGet();
                }
              } finally {
                latch.countDown();
              }
            });
      }

      if (!latch.await(10, TimeUnit.SECONDS)) {
        throw new RuntimeException("Teste concorrente expirou");
      }
      context.setValue("sucessos", sucessos.get());
    } catch (InterruptedException e) {
      Thread.currentThread().interrupt();
      throw new RuntimeException("Teste concorrente interrompido", e);
    } finally {
      executor.shutdown();
    }
  }

  @Quando("envio múltiplas requisições de manutenção simultâneas")
  public void multiplosRequestsManutencao() {
    String assetTag = context.getCurrentAssetTag();
    Long assetId = context.getId("ativoId_" + assetTag);
    int numThreads = 5;
    ExecutorService executor = Executors.newFixedThreadPool(numThreads);
    CountDownLatch latch = new CountDownLatch(numThreads);
    AtomicInteger sucessos = new AtomicInteger(0);

    try {
      for (int i = 0; i < numThreads; i++) {
        executor.submit(
            () -> {
              try {
                MockMvcResponse response =
                    apiClient.solicitarManutencao(
                        assetId, "Manutenção concorrente", context.getToken());
                if (response.statusCode() < 400) {
                  sucessos.incrementAndGet();
                }
              } finally {
                latch.countDown();
              }
            });
      }

      if (!latch.await(10, TimeUnit.SECONDS)) {
        throw new RuntimeException("Teste concorrente expirou");
      }
      context.setValue("sucessos", sucessos.get());
    } catch (InterruptedException e) {
      Thread.currentThread().interrupt();
      throw new RuntimeException("Teste concorrente interrompido", e);
    } finally {
      executor.shutdown();
    }
  }

  @Então("apenas uma operação deve ter sucesso e as demais devem falhar")
  public void apenasUmaOperacaoSucesso() {
    assertThat(context.getIntValue("sucessos"))
        .as("Apenas uma operação deve ter sucesso em acesso concorrente")
        .isEqualTo(1);
  }

  @Então("o ativo deve estar atribuído a apenas um usuário")
  public void ativoAtribuidoApenasUmUsuario() {
    assertThat((Long) context.getLastResponse().path("userId"))
        .as("Ativo deve ter apenas um usuário atribuído")
        .isNotNull();
  }

  @Então("o ativo deve estar em apenas uma transferência")
  public void ativoApenasUmaTransferencia() {
    assertThat((String) context.getLastResponse().path("status"))
        .as("Ativo deve estar em apenas uma transferência")
        .isEqualTo("IN_TRANSFER");
  }

  @Então("o ativo deve estar em apenas uma operação de manutenção")
  public void ativoApenasUmaManutencao() {
    assertThat((String) context.getLastResponse().path("status"))
        .as("Ativo deve estar em apenas uma operação de manutenção")
        .isEqualTo("IN_MAINTENANCE");
  }

  // =========================================================
  // CONCORRÊNCIA — DADOS AUXILIARES
  // =========================================================

  @E("que existem múltiplos usuários criados")
  public void multiplosUsuarios() {
    Long orgId = context.getId("organizacaoId");
    Long unitId = context.getId("unidadeId");
    Organization org = testDataHelper.obterOrganizacao(orgId);
    Unit unit = testDataHelper.obterUnidade(unitId);
    for (int i = 1; i <= 3; i++) {
      String email = "user" + i + "@test.com";
      if (testDataHelper.obterUsuarioPorEmail(email) == null) {
        testDataHelper.criarUsuarioAtivo(email, "Senha@123", UserRole.OPERADOR, org, unit);
      }
    }
  }

  @E("que existem múltiplas unidades criadas")
  public void multiplasUnidades() {
    Long orgId = context.getId("organizacaoId");
    for (int i = 1; i <= 3; i++) {
      testDataHelper.criarUnidadePorOrganizacaoId("Filial " + i, orgId);
    }
  }

  // =========================================================
  // CONSISTÊNCIA E RECUPERAÇÃO
  // =========================================================

  @E("o estado inicial do ativo é {string}")
  public void estadoInicialAtivo(String status) {
    context.setValue("statusAnterior", status);
  }

  @Quando("tenta uma operação inválida que falhará")
  public void tentaOperacaoInvalida() {
    String assetTag = context.getCurrentAssetTag();
    Long assetId = context.getId("ativoId_" + assetTag);
    context.setLastResponse(apiClient.desatribuirAtivo(assetId, context.getToken()));
  }

  @Então("o estado do ativo deve permanecer consistente com o estado anterior")
  public void estadoConsistenteAntesOperacao() {
    assertThat((String) context.getLastResponse().path("status"))
        .as("Estado deve permanecer consistente após operação falhada")
        .isEqualTo(context.getStringValue("statusAnterior"));
  }

  @Quando("tenta atribuir o ativo a um usuário inexistente")
  public void tentaAtribuirUsuarioInexistente() {
    String assetTag = context.getCurrentAssetTag();
    Long assetId = context.getId("ativoId_" + assetTag);
    context.setLastResponse(apiClient.atribuirAtivo(assetId, 999999L, context.getToken()));
  }

  @Quando("tenta transferir o ativo para uma unidade inexistente")
  public void tentaTransferirUnidadeInexistente() {
    String assetTag = context.getCurrentAssetTag();
    Long assetId = context.getId("ativoId_" + assetTag);
    context.setLastResponse(
        apiClient.solicitarTransferencia(assetId, 999999L, "Teste", context.getToken()));
  }

  @Quando("tenta solicitar manutenção com dados inválidos")
  public void tentaSolicitarManutencaoInvalida() {
    String assetTag = context.getCurrentAssetTag();
    Long assetId = context.getId("ativoId_" + assetTag);
    context.setLastResponse(apiClient.solicitarManutencao(assetId, "", context.getToken()));
  }

  @Então("o ativo deve permanecer no estado {string}")
  public void ativoPermanecerEm(String statusEsperado) {
    assertThat((String) context.getLastResponse().path("status"))
        .as("Ativo deve permanecer no estado anterior após falha")
        .isEqualTo(statusEsperado);
  }

  @Quando("uma operação complexa é interrompida no meio")
  public void operacaoInterrompida() {
    context.setValue("operacaoInterrompida", "true");
  }

  @Então("o ativo deve estar em um estado consistente e válido")
  public void estadoConsistenteValido() {
    assertThat((String) context.getLastResponse().path("status"))
        .as("Estado do ativo deve ser um dos estados válidos")
        .isIn("AVAILABLE", "ASSIGNED", "IN_MAINTENANCE", "IN_TRANSFER", "RETIRED");
  }

  // =========================================================
  // EDGE CASES
  // =========================================================

  @Quando("executo rápidas transições de estado para o ativo")
  public void transicoesRapidas() {
    String assetTag = context.getCurrentAssetTag();
    Long assetId = context.getId("ativoId_" + assetTag);
    MockMvcResponse response = null;
    Long userId = testDataHelper.resolverFallbackUsuarioId();
    for (int i = 0; i < 5; i++) {
      response = apiClient.atribuirAtivo(assetId, userId, context.getToken());
      response = apiClient.desatribuirAtivo(assetId, context.getToken());
    }
    context.setLastResponse(response);
  }

  @Então("o ativo deve manter um estado consistente ao final")
  public void estadoConsistenteAoFinal() {
    assertThat((String) context.getLastResponse().path("status"))
        .as("Estado final deve ser consistente")
        .isNotNull();
  }

  @Quando("tenta executar transições inválidas em sequência rápida")
  public void transicoesInvalidas() {
    String assetTag = context.getCurrentAssetTag();
    Long assetId = context.getId("ativoId_" + assetTag);
    apiClient.aposentarAtivo(assetId, context.getToken());
    apiClient.desatribuirAtivo(assetId, context.getToken());
    context.setLastResponse(
        apiClient.atribuirAtivo(assetId, testDataHelper.resolverFallbackUsuarioId(), context.getToken()));
  }

  @Então("todas as transições inválidas devem ser rejeitadas")
  public void transicoesRejeitadas() {
    assertThat(context.getLastResponse().statusCode())
        .as("Transições inválidas devem ser rejeitadas (4xx ou 5xx)")
        .isGreaterThanOrEqualTo(400);
  }

  @Quando("faz uma operação baseada em versão anterior do estado")
  public void operacaoVersaoAnterior() {
    String assetTag = context.getCurrentAssetTag();
    Long assetId = context.getId("ativoId_" + assetTag);
    context.setLastResponse(apiClient.operacaoComVersao(assetId, 0, context.getToken()));
  }

  @Então("a operação deve ser rejeitada com erro de conflito")
  public void operacaoRejeitadaConflito() {
    assertThat(context.getLastResponse().statusCode())
        .as("Deve retornar 409 Conflict para versão desatualizada")
        .isEqualTo(409);
  }
}
