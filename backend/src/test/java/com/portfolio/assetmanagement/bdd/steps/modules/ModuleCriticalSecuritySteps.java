package com.portfolio.assetmanagement.bdd.steps.modules;

import com.portfolio.assetmanagement.bdd.client.ApiClient;
import com.portfolio.assetmanagement.bdd.context.ScenarioContext;
import io.cucumber.java.pt.Quando;
import io.restassured.module.mockmvc.response.MockMvcResponse;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Autowired;

/**
 * Steps genéricos para automação dos cenários BLOCKER/CRITICAL dos módulos novos.
 *
 * <p>Este step evita duplicação entre módulos mantendo o mesmo padrão de autenticação
 * e execução HTTP usado no restante da suíte BDD.
 */
public class ModuleCriticalSecuritySteps {

  @Autowired private ApiClient apiClient;
  @Autowired private ScenarioContext context;

  @Quando("acesso o endpoint de sucesso do módulo {string} autenticado como {string} com senha {string}")
  public void acessoEndpointSucessoAutenticado(String modulo, String email, String senha) {
    String token = autenticar(email, senha);
    RequestPlan plan = successPlan(modulo);
    MockMvcResponse response = apiClient.request(plan.method(), plan.path(), plan.body(), token);
    context.setLastResponse(response);
  }

  @Quando("acesso o endpoint restrito do módulo {string} autenticado como {string} com senha {string}")
  public void acessoEndpointRestritoAutenticado(String modulo, String email, String senha) {
    String token = autenticar(email, senha);
    RequestPlan plan = forbiddenPlan(modulo);
    MockMvcResponse response = apiClient.request(plan.method(), plan.path(), plan.body(), token);
    context.setLastResponse(response);
  }

  @Quando("acesso o endpoint de sucesso do módulo {string} sem autenticação")
  public void acessoEndpointSucessoSemAutenticacao(String modulo) {
    RequestPlan plan = successPlan(modulo);
    MockMvcResponse response = apiClient.requestWithoutAuth(plan.method(), plan.path(), plan.body());
    context.setLastResponse(response);
  }

  @Quando("acesso o endpoint de sucesso do módulo {string} com token inválido {string}")
  public void acessoEndpointSucessoComTokenInvalido(String modulo, String tokenInvalido) {
    RequestPlan plan = successPlan(modulo);
    MockMvcResponse response =
        apiClient.requestWithRawAuth(plan.method(), plan.path(), plan.body(), "Bearer " + tokenInvalido);
    context.setLastResponse(response);
  }

  private String autenticar(String email, String senha) {
    MockMvcResponse login = apiClient.login(email, senha);
    context.setLastResponse(login);
    return login.path("accessToken");
  }

  private RequestPlan successPlan(String modulo) {
    String module = modulo.toLowerCase();
    return switch (module) {
      case "ai" -> new RequestPlan("GET", "/api/ai/analysis/history", null);
      case "audit" -> new RequestPlan("GET", "/audit", null);
      case "category" -> new RequestPlan("POST", "/categories", categoryBody("Categoria Critica"));
      case "costcenter" -> new RequestPlan("GET", "/cost-centers", null);
      case "dashboard" -> new RequestPlan("GET", "/api/dashboard/executive", null);
      case "depreciation" -> new RequestPlan("GET", "/assets/depreciation/portfolio", null);
      case "export" -> new RequestPlan("GET", "/export/audit", null);
      case "insurance" -> new RequestPlan("GET", "/assets/insurance/summary", null);
      case "inventory" -> new RequestPlan("GET", "/inventory", null);
      case "organization" -> new RequestPlan("GET", "/organizations", null);
      case "unit" -> new RequestPlan("GET", "/units/" + context.getId("organizacaoId"), null);
      case "user" -> new RequestPlan("POST", "/users", userBody());
      default -> throw new IllegalArgumentException("Módulo não suportado no plano de sucesso: " + modulo);
    };
  }

  private RequestPlan forbiddenPlan(String modulo) {
    String module = modulo.toLowerCase();
    return switch (module) {
      case "ai" ->
          new RequestPlan(
              "POST",
              "/api/ai/analysis/multi-agent",
              Map.of("title", "Teste", "description", "Analise multi-agent"));
      case "audit" -> new RequestPlan("GET", "/audit", null);
      case "category" -> new RequestPlan("POST", "/categories", categoryBody("Categoria Restrita"));
      case "costcenter" -> new RequestPlan("GET", "/cost-centers", null);
      case "dashboard" -> new RequestPlan("GET", "/api/dashboard/executive", null);
      case "depreciation" -> new RequestPlan("GET", "/assets/depreciation/portfolio", null);
      case "export" -> new RequestPlan("GET", "/export/audit", null);
      case "insurance" -> new RequestPlan("GET", "/assets/insurance/summary", null);
      case "inventory" -> new RequestPlan("PATCH", "/inventory/999999/start", null);
      case "organization" -> new RequestPlan("GET", "/organizations", null);
      case "unit" -> new RequestPlan("GET", "/units/" + context.getId("organizacaoId"), null);
      case "user" -> new RequestPlan("POST", "/users", userBody());
      default -> throw new IllegalArgumentException("Módulo não suportado no plano restrito: " + modulo);
    };
  }

  private Map<String, Object> categoryBody(String nome) {
    Map<String, Object> body = new HashMap<>();
    body.put("name", nome + " " + UUID.randomUUID().toString().substring(0, 8));
    body.put("description", "Categoria gerada para cenário crítico de segurança");
    return body;
  }

  private Map<String, Object> userBody() {
    String unique = UUID.randomUUID().toString().substring(0, 8);
    Map<String, Object> body = new HashMap<>();
    body.put("name", "Usuario Critico " + unique);
    body.put("email", "critical." + unique + "@acme.com");
    body.put("role", "OPERADOR");
    body.put("organizationId", context.getId("organizacaoId"));
    body.put("unitId", context.getId("unidadeId"));
    body.put("documentNumber", "12345678901");
    body.put("phoneNumber", "5511999999999");
    return body;
  }

  private record RequestPlan(String method, String path, Object body) {}
}
