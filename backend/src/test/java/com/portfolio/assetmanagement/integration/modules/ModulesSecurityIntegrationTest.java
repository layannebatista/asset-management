package com.portfolio.assetmanagement.integration.modules;

import static org.assertj.core.api.Assertions.assertThat;

import com.portfolio.assetmanagement.integration.BaseIntegrationTest;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import io.qameta.allure.Severity;
import io.qameta.allure.SeverityLevel;
import io.qameta.allure.Story;
import io.restassured.module.mockmvc.response.MockMvcResponse;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Stream;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

@Epic("Backend")
@Feature("Integração — Novos módulos")
@DisplayName("Matriz de Segurança (BLOCKER/CRITICAL)")
@Tag("testType=Integration")
@Tag("module=Modules")
class ModulesSecurityIntegrationTest extends BaseIntegrationTest {

  @ParameterizedTest(name = "{0} sem autenticação retorna 401")
  @MethodSource("modulesForNoAuth")
  @Story("Autenticação obrigatória")
  @Severity(SeverityLevel.BLOCKER)
  void semAutenticacaoRetorna401(String module, RequestPlan plan) {
    MockMvcResponse response = apiClient.requestWithoutAuth(plan.method(), plan.path(), plan.body());
    assertThat(response.statusCode()).isEqualTo(401);
  }

  @ParameterizedTest(name = "{0} papel sem permissão retorna 403")
  @MethodSource("modulesForForbidden")
  @Story("Controle de acesso por papel")
  @Severity(SeverityLevel.CRITICAL)
  void papelSemPermissaoRetorna403(String module, RequestPlan plan, String role) {
    String token = tokenByRole(role);
    MockMvcResponse response = apiClient.request(plan.method(), plan.path(), plan.body(), token);
    assertThat(response.statusCode()).isEqualTo(403);
  }

  @ParameterizedTest(name = "{0} com JWT inválido retorna 401")
  @MethodSource("modulesForInvalidJwt")
  @Story("Proteção contra JWT forjado")
  @Severity(SeverityLevel.BLOCKER)
  void jwtInvalidoRetorna401(String module, RequestPlan plan) {
    MockMvcResponse response =
        apiClient.requestWithRawAuth(
            plan.method(), plan.path(), plan.body(), "Bearer jwt.invalido." + module);
    assertThat(response.statusCode()).isEqualTo(401);
  }

  @ParameterizedTest(name = "{0} fluxo crítico com papel autorizado")
  @MethodSource("modulesForSuccess")
  @Story("Fluxo principal autorizado")
  @Severity(SeverityLevel.CRITICAL)
  void fluxoPrincipalComPapelAutorizado(
      String module, RequestPlan plan, String role, int expectedStatus) {
    String token = tokenByRole(role);
    MockMvcResponse response = apiClient.request(plan.method(), plan.path(), plan.body(), token);
    assertThat(response.statusCode()).isEqualTo(expectedStatus);
  }

  private String tokenByRole(String role) {
    return switch (role) {
      case "ADMIN" -> loginComoAdmin();
      case "GESTOR" -> loginComoGestor();
      case "OPERADOR" -> loginComoOperador();
      default -> throw new IllegalArgumentException("Role não suportada: " + role);
    };
  }

  static Stream<Arguments> modulesForNoAuth() {
    return Stream.of(
        Arguments.of("organization", new RequestPlan("GET", "/organizations", null)),
        Arguments.of("user", new RequestPlan("POST", "/users", userBody(1L, 1L))),
        Arguments.of("unit", new RequestPlan("GET", "/units/1", null)),
        Arguments.of("category", new RequestPlan("POST", "/categories", categoryBody())),
        Arguments.of("audit", new RequestPlan("GET", "/audit", null)),
        Arguments.of("costcenter", new RequestPlan("GET", "/cost-centers", null)),
        Arguments.of("dashboard", new RequestPlan("GET", "/api/dashboard/executive", null)),
        Arguments.of("depreciation", new RequestPlan("GET", "/assets/depreciation/portfolio", null)),
        Arguments.of("export", new RequestPlan("GET", "/export/audit", null)),
        Arguments.of("insurance", new RequestPlan("GET", "/assets/insurance/summary", null)),
        Arguments.of("inventory", new RequestPlan("GET", "/inventory", null)),
        Arguments.of("ai", new RequestPlan("GET", "/api/ai/analysis/history", null)));
  }

  static Stream<Arguments> modulesForForbidden() {
    return Stream.of(
        Arguments.of("organization", new RequestPlan("GET", "/organizations", null), "GESTOR"),
        Arguments.of("user", new RequestPlan("POST", "/users", userBody(1L, 1L)), "GESTOR"),
        Arguments.of("unit", new RequestPlan("GET", "/units/1", null), "OPERADOR"),
        Arguments.of("category", new RequestPlan("POST", "/categories", categoryBody()), "OPERADOR"),
        Arguments.of("audit", new RequestPlan("GET", "/audit", null), "OPERADOR"),
        Arguments.of("costcenter", new RequestPlan("GET", "/cost-centers", null), "GESTOR"),
        Arguments.of("dashboard", new RequestPlan("GET", "/api/dashboard/executive", null), "GESTOR"),
        Arguments.of("depreciation", new RequestPlan("GET", "/assets/depreciation/portfolio", null), "OPERADOR"),
        Arguments.of("export", new RequestPlan("GET", "/export/audit", null), "GESTOR"),
        Arguments.of("insurance", new RequestPlan("GET", "/assets/insurance/summary", null), "OPERADOR"),
        Arguments.of("inventory", new RequestPlan("PATCH", "/inventory/999999/start", null), "OPERADOR"),
        Arguments.of("ai", new RequestPlan("POST", "/api/ai/analysis/multi-agent", aiBody()), "GESTOR"));
  }

  static Stream<Arguments> modulesForInvalidJwt() {
    return modulesForNoAuth();
  }

  static Stream<Arguments> modulesForSuccess() {
    return Stream.of(
        Arguments.of("organization", new RequestPlan("GET", "/organizations", null), "ADMIN", 200),
        Arguments.of("user", new RequestPlan("POST", "/users", userBody(1L, 1L)), "ADMIN", 201),
        Arguments.of("unit", new RequestPlan("GET", "/units/1", null), "GESTOR", 200),
        Arguments.of("category", new RequestPlan("POST", "/categories", categoryBody()), "ADMIN", 200),
        Arguments.of("audit", new RequestPlan("GET", "/audit", null), "GESTOR", 200),
        Arguments.of("costcenter", new RequestPlan("GET", "/cost-centers", null), "ADMIN", 200),
        Arguments.of("dashboard", new RequestPlan("GET", "/api/dashboard/executive", null), "ADMIN", 200),
        Arguments.of("depreciation", new RequestPlan("GET", "/assets/depreciation/portfolio", null), "ADMIN", 200),
        Arguments.of("export", new RequestPlan("GET", "/export/audit", null), "ADMIN", 200),
        Arguments.of("insurance", new RequestPlan("GET", "/assets/insurance/summary", null), "ADMIN", 200),
        Arguments.of("inventory", new RequestPlan("GET", "/inventory", null), "GESTOR", 200));
  }

  private static Map<String, Object> categoryBody() {
    Map<String, Object> body = new HashMap<>();
    body.put("name", "CAT-CRIT-" + System.nanoTime());
    body.put("description", "Categoria crítica de segurança");
    return body;
  }

  private static Map<String, Object> userBody(Long orgId, Long unitId) {
    Map<String, Object> body = new HashMap<>();
    body.put("name", "User Crit " + System.nanoTime());
    body.put("email", "u" + System.nanoTime() + "@test.com");
    body.put("role", "OPERADOR");
    body.put("organizationId", orgId);
    body.put("unitId", unitId);
    body.put("documentNumber", "12345678901");
    body.put("phoneNumber", "5511999999999");
    return body;
  }

  private static Map<String, Object> aiBody() {
    Map<String, Object> body = new HashMap<>();
    body.put("title", "Analise multi-agent");
    body.put("description", "Teste de permissão crítica");
    return body;
  }

  private record RequestPlan(String method, String path, Object body) {}
}
