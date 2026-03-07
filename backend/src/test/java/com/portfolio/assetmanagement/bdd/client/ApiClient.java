package com.portfolio.assetmanagement.bdd.client;

import static io.restassured.module.mockmvc.RestAssuredMockMvc.given;

import io.restassured.http.ContentType;
import io.restassured.module.mockmvc.RestAssuredMockMvc;
import io.restassured.module.mockmvc.response.MockMvcResponse;
import java.util.Map;
import org.springframework.stereotype.Component;
import org.springframework.web.context.WebApplicationContext;

/**
 * CAMADA 3 — Cliente HTTP centralizado para os testes BDD.
 *
 * <p>Todos os steps usam este cliente em vez de escrever RestAssured diretamente. Isso garante que
 * mudanças de configuração (base path, headers) sejam feitas em um único lugar.
 *
 * <p>POR QUE RestAssuredMockMvc E NÃO RestAssured NORMAL? - RestAssured normal precisa de porta
 * HTTP real (WebEnvironment.RANDOM_PORT) - RestAssuredMockMvc usa MockMvc — sem porta, mais rápido
 * - Os filtros de segurança JWT continuam sendo executados normalmente - É a combinação ideal com
 * spring-boot-starter-test + SpringBootTest(MOCK)
 *
 * <p>PADRÃO DE MÉTODO: Cada método representa uma operação de negócio, não um endpoint. Ex:
 * login(), criarManutencao(), iniciarManutencao() Os steps chamam esses métodos — nunca constroem
 * requisições diretamente.
 *
 * <p>CONVENÇÃO DE RETORNO: Todos os métodos retornam Response (sem fazer asserts). Os asserts ficam
 * nos steps de "Then" — separação de responsabilidade.
 */
@Component
public class ApiClient {

  private final WebApplicationContext webApplicationContext;

  public ApiClient(WebApplicationContext webApplicationContext) {
    this.webApplicationContext = webApplicationContext;
    // Inicializa o MockMvc com o contexto Spring completo (incluindo filtros de segurança)
    RestAssuredMockMvc.webAppContextSetup(webApplicationContext);
  }

  // =========================================================
  // AUTH
  // =========================================================

  /**
   * POST /auth/login
   *
   * <p>Endpoint público — sem Authorization header.
   */
  public MockMvcResponse login(String email, String senha) {
    return given()
        .contentType(ContentType.JSON)
        .body(Map.of("email", email, "password", senha))
        .when()
        .post("/auth/login")
        .then()
        .extract()
        .response();
  }

  // =========================================================
  // MANUTENÇÃO
  // =========================================================

  /**
   * POST /api/maintenance
   *
   * <p>Requer token JWT de ADMIN ou GESTOR.
   */
  public MockMvcResponse criarManutencao(Long assetId, String descricao, String token) {
    return given()
        .contentType(ContentType.JSON)
        .header("Authorization", "Bearer " + token)
        .body(Map.of("assetId", assetId, "description", descricao))
        .when()
        .post("/api/maintenance")
        .then()
        .extract()
        .response();
  }

  /** POST /api/maintenance/{id}/start */
  public MockMvcResponse iniciarManutencao(Long maintenanceId, String token) {
    return given()
        .contentType(ContentType.JSON)
        .header("Authorization", "Bearer " + token)
        .when()
        .post("/api/maintenance/{id}/start", maintenanceId)
        .then()
        .extract()
        .response();
  }

  /** POST /api/maintenance/{id}/complete */
  public MockMvcResponse concluirManutencao(Long maintenanceId, String resolucao, String token) {
    return given()
        .contentType(ContentType.JSON)
        .header("Authorization", "Bearer " + token)
        .queryParam("resolution", resolucao)
        .when()
        .post("/api/maintenance/{id}/complete", maintenanceId)
        .then()
        .extract()
        .response();
  }

  /** POST /api/maintenance/{id}/cancel */
  public MockMvcResponse cancelarManutencao(Long maintenanceId, String token) {
    return given()
        .contentType(ContentType.JSON)
        .header("Authorization", "Bearer " + token)
        .when()
        .post("/api/maintenance/{id}/cancel", maintenanceId)
        .then()
        .extract()
        .response();
  }

  // =========================================================
  // ASSET (necessário para setup dos cenários de manutenção)
  // =========================================================

  /** GET /assets/{id} */
  public MockMvcResponse buscarAtivo(Long assetId, String token) {
    return given()
        .contentType(ContentType.JSON)
        .header("Authorization", "Bearer " + token)
        .when()
        .get("/assets/{id}", assetId)
        .then()
        .extract()
        .response();
  }

  // =========================================================
  // REQUISIÇÃO SEM TOKEN — para testar cenários de 401/403
  // =========================================================

  /**
   * Faz uma requisição sem header Authorization. Usado nos cenários que validam que OPERADOR não
   * pode acessar o endpoint.
   */
  public MockMvcResponse postSemToken(String path, Object body) {
    return given()
        .contentType(ContentType.JSON)
        .body(body)
        .when()
        .post(path)
        .then()
        .extract()
        .response();
  }

  /**
   * Faz uma requisição com token de role insuficiente. Usado nos cenários "Dado que eu sou
   * OPERADOR, Quando tento criar manutenção".
   */
  public MockMvcResponse criarManutencaoComToken(Long assetId, String descricao, String token) {
    return criarManutencao(assetId, descricao, token);
  }
}
