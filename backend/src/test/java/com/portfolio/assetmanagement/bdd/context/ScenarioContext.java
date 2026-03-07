package com.portfolio.assetmanagement.bdd.context;

import io.cucumber.spring.ScenarioScope;
import io.restassured.module.mockmvc.response.MockMvcResponse;
import java.util.HashMap;
import java.util.Map;
import org.springframework.stereotype.Component;

/**
 * CAMADA 3 — Contexto compartilhado entre Steps do mesmo cenário.
 *
 * <p>@ScenarioScope = nova instância por cenário, destruída ao final. Isso garante que IDs, tokens
 * e responses de um cenário não "vazem" para o próximo cenário.
 *
 * <p>POR QUE ISSO EXISTE? No Cucumber, cada step (Given/When/Then) pode estar em classes
 * diferentes. Para passar o token JWT do AuthSteps para o MaintenanceSteps, por exemplo, precisamos
 * de um objeto compartilhado com escopo de cenário.
 *
 * <p>PADRÃO DE USO NOS STEPS: - AuthSteps salva o token: context.setToken(response.path("token")) -
 * MaintenanceSteps lê o token: context.getToken() - MaintenanceSteps salva o ID criado:
 * context.setLastCreatedId(id) - Próximo step lê: context.getLastCreatedId()
 *
 * <p>O Map<String, Long> ids permite guardar múltiplos IDs com nome: context.setId("manutencaoId",
 * 55L) context.getId("manutencaoId")
 */
@Component
@ScenarioScope
public class ScenarioContext {

  // Token JWT do usuário autenticado no cenário atual
  private String token;

  // Última resposta HTTP recebida — usada pelos steps de Then para fazer asserts
  private MockMvcResponse lastResponse;

  // IDs criados durante o cenário, indexados por nome semântico
  private final Map<String, Long> ids = new HashMap<>();

  // =========================================================
  // Token JWT
  // =========================================================

  public void setToken(String token) {
    this.token = token;
  }

  public String getToken() {
    return token;
  }

  public String getBearerToken() {
    return "Bearer " + token;
  }

  // =========================================================
  // Última response HTTP
  // =========================================================

  public void setLastResponse(MockMvcResponse response) {
    this.lastResponse = response;
  }

  public MockMvcResponse getLastResponse() {
    return lastResponse;
  }

  // =========================================================
  // IDs nomeados — para cenários com múltiplas entidades
  // =========================================================

  public void setId(String name, Long id) {
    ids.put(name, id);
  }

  public Long getId(String name) {
    Long id = ids.get(name);
    if (id == null) {
      throw new IllegalStateException(
          "ID '"
              + name
              + "' não encontrado no contexto do cenário. "
              + "Verifique se o step anterior criou e salvou este ID corretamente.");
    }
    return id;
  }

  // Atalhos semânticos para o ID mais comum do cenário
  public void setLastCreatedId(Long id) {
    ids.put("lastCreatedId", id);
  }

  public Long getLastCreatedId() {
    return getId("lastCreatedId");
  }
}
