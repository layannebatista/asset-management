package com.portfolio.assetmanagement.bdd.client;

import static io.restassured.module.mockmvc.RestAssuredMockMvc.given;

import com.portfolio.assetmanagement.domain.asset.enums.AssetType;
import com.portfolio.assetmanagement.domain.transfer.enums.TransferStatus;
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

  public ApiClient(WebApplicationContext webApplicationContext) {
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
        .post("/maintenance")
        .then()
        .extract()
        .response();
  }

  /** POST /maintenance/{id}/start */
  public MockMvcResponse iniciarManutencao(Long maintenanceId, String token) {
    return given()
        .contentType(ContentType.JSON)
        .header("Authorization", "Bearer " + token)
        .when()
        .post("/maintenance/{id}/start", String.valueOf(maintenanceId))
        .then()
        .extract()
        .response();
  }

  /**
   * POST /maintenance/{id}/complete — resolution via query param conforme @RequestParam no
   * controller
   */
  public MockMvcResponse concluirManutencao(Long maintenanceId, String resolucao, String token) {
    return given()
        .contentType(ContentType.JSON)
        .header("Authorization", "Bearer " + token)
        .queryParam("resolution", resolucao)
        .when()
        .post("/maintenance/{id}/complete", String.valueOf(maintenanceId))
        .then()
        .extract()
        .response();
  }

  /** POST /maintenance — com estimatedCost (para testar custo inválido). */
  public MockMvcResponse criarManutencaoComCusto(
      Long assetId, String descricao, double estimatedCost, String token) {
    return given()
        .contentType(ContentType.JSON)
        .header("Authorization", "Bearer " + token)
        .body(Map.of("assetId", assetId, "description", descricao, "estimatedCost", estimatedCost))
        .when()
        .post("/maintenance")
        .then()
        .extract()
        .response();
  }

  /** POST /maintenance/{id}/complete sem query param resolution (para testar 400). */
  public MockMvcResponse concluirManutencaoSemResolucao(Long maintenanceId, String token) {
    return given()
        .contentType(ContentType.JSON)
        .header("Authorization", "Bearer " + token)
        .when()
        .post("/maintenance/{id}/complete", String.valueOf(maintenanceId))
        .then()
        .extract()
        .response();
  }

  /** POST /maintenance/{id}/cancel */
  public MockMvcResponse cancelarManutencao(Long maintenanceId, String token) {
    return given()
        .contentType(ContentType.JSON)
        .header("Authorization", "Bearer " + token)
        .when()
        .post("/maintenance/{id}/cancel", String.valueOf(maintenanceId))
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
        .get("/assets/{id}", String.valueOf(assetId))
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

  // =========================================================
  // ASSET — operações de ativos
  // =========================================================

  /** GET /assets — lista paginada de ativos com token. */
  public MockMvcResponse listarAtivos(String token) {
    return given()
        .contentType(ContentType.JSON)
        .header("Authorization", "Bearer " + token)
        .when()
        .get("/assets")
        .then()
        .extract()
        .response();
  }

  /** GET /assets?status={status} — filtra ativos pelo status. */
  public MockMvcResponse listarAtivosPorStatus(String status, String token) {
    return given()
        .contentType(ContentType.JSON)
        .header("Authorization", "Bearer " + token)
        .queryParam("status", status)
        .when()
        .get("/assets")
        .then()
        .extract()
        .response();
  }

  /** GET /assets?assetTag={assetTag} — filtra ativos pelo código. */
  public MockMvcResponse listarAtivosPorAssetTag(String assetTag, String token) {
    return given()
        .contentType(ContentType.JSON)
        .header("Authorization", "Bearer " + token)
        .queryParam("assetTag", assetTag)
        .when()
        .get("/assets")
        .then()
        .extract()
        .response();
  }

  /** GET /assets — lista sem autenticação (para testar 401). */
  public MockMvcResponse getSemToken(String path) {
    return given()
        .contentType(ContentType.JSON)
        .when()
        .get(path)
        .then()
        .extract()
        .response();
  }

  /** POST /assets/{orgId} — cria ativo com campos válidos. */
  public MockMvcResponse criarAtivo(
      Long orgId, String assetTag, AssetType type, String model, Long unitId, String token) {
    return given()
        .contentType(ContentType.JSON)
        .header("Authorization", "Bearer " + token)
        .body(Map.of("assetTag", assetTag, "type", type.name(), "model", model, "unitId", unitId))
        .when()
        .post("/assets/{orgId}", String.valueOf(orgId))
        .then()
        .extract()
        .response();
  }

  /** POST /assets/{orgId} — cria ativo com body vazio (para testar 400). */
  public MockMvcResponse criarAtivoComDadosInvalidos(Long orgId, String token) {
    return given()
        .contentType(ContentType.JSON)
        .header("Authorization", "Bearer " + token)
        .body(Map.of())
        .when()
        .post("/assets/{orgId}", String.valueOf(orgId))
        .then()
        .extract()
        .response();
  }

  /** POST /assets/{orgId} — com assetTag contendo apenas espaços (para testar 400). */
  public MockMvcResponse criarAtivoComAssetTagBranco(Long orgId, Long unitId, String token) {
    return given()
        .contentType(ContentType.JSON)
        .header("Authorization", "Bearer " + token)
        .body(Map.of("assetTag", "   ", "type", "NOTEBOOK", "model", "Modelo Espaço", "unitId", unitId))
        .when()
        .post("/assets/{orgId}", String.valueOf(orgId))
        .then()
        .extract()
        .response();
  }

  /** POST /assets/{orgId} — sem assetTag (para testar 400). */
  public MockMvcResponse criarAtivoSemAssetTag(Long orgId, Long unitId, String token) {
    return given()
        .contentType(ContentType.JSON)
        .header("Authorization", "Bearer " + token)
        .body(Map.of("type", "NOTEBOOK", "model", "Modelo Sem Tag", "unitId", unitId))
        .when()
        .post("/assets/{orgId}", String.valueOf(orgId))
        .then()
        .extract()
        .response();
  }

  /** POST /assets/{orgId} — sem type (para testar 400). */
  public MockMvcResponse criarAtivoSemType(Long orgId, String assetTag, Long unitId, String token) {
    return given()
        .contentType(ContentType.JSON)
        .header("Authorization", "Bearer " + token)
        .body(Map.of("assetTag", assetTag, "model", "Modelo Sem Tipo", "unitId", unitId))
        .when()
        .post("/assets/{orgId}", String.valueOf(orgId))
        .then()
        .extract()
        .response();
  }

  /** PATCH /assets/{id}/retire — aposenta ativo. Requer role ADMIN. */
  public MockMvcResponse aposentarAtivo(Long assetId, String token) {
    return given()
        .contentType(ContentType.JSON)
        .header("Authorization", "Bearer " + token)
        .when()
        .patch("/assets/{id}/retire", String.valueOf(assetId))
        .then()
        .extract()
        .response();
  }

  /** PATCH /assets/{assetId}/assign/{userId} — atribui ativo a usuário. */
  public MockMvcResponse atribuirAtivo(Long assetId, Long userId, String token) {
    return given()
        .contentType(ContentType.JSON)
        .header("Authorization", "Bearer " + token)
        .when()
        .patch("/assets/{assetId}/assign/{userId}", String.valueOf(assetId), String.valueOf(userId))
        .then()
        .extract()
        .response();
  }

  /** PATCH /assets/{assetId}/unassign — remove atribuição de usuário. */
  public MockMvcResponse desatribuirAtivo(Long assetId, String token) {
    return given()
        .contentType(ContentType.JSON)
        .header("Authorization", "Bearer " + token)
        .when()
        .patch("/assets/{assetId}/unassign", String.valueOf(assetId))
        .then()
        .extract()
        .response();
  }

  /** POST /auth/refresh */
  public MockMvcResponse refresh(String refreshToken) {
    return given()
        .contentType(ContentType.JSON)
        .body(Map.of("refreshToken", refreshToken))
        .when()
        .post("/auth/refresh")
        .then()
        .extract()
        .response();
  }

  /** POST /auth/refresh sem corpo — para testar cenário "sem enviar refreshToken". */
  public MockMvcResponse refreshSemCorpo() {
    return given()
        .contentType(ContentType.JSON)
        .body(Map.of())
        .when()
        .post("/auth/refresh")
        .then()
        .extract()
        .response();
  }

  /** POST /auth/logout sem Authorization header — para testar 401. */
  public MockMvcResponse logoutSemToken() {
    return given()
        .contentType(ContentType.JSON)
        .when()
        .post("/auth/logout")
        .then()
        .extract()
        .response();
  }

  /** POST /auth/logout */
  public MockMvcResponse logout(String token) {
    return given()
        .contentType(ContentType.JSON)
        .header("Authorization", "Bearer " + token)
        .when()
        .post("/auth/logout")
        .then()
        .extract()
        .response();
  }

  // =========================================================
  // TRANSFERÊNCIA
  // =========================================================

  /** POST /transfers — solicita transferência para outra unidade. */
  public MockMvcResponse solicitarTransferencia(
      Long assetId, Long toUnitId, String motivo, String token) {
    return given()
        .contentType(ContentType.JSON)
        .header("Authorization", "Bearer " + token)
        .body(Map.of("assetId", assetId, "toUnitId", toUnitId, "reason", motivo))
        .when()
        .post("/transfers")
        .then()
        .extract()
        .response();
  }

  /** POST /transfers sem assetId — para testar 400. */
  public MockMvcResponse solicitarTransferenciaSemAssetId(
      Long toUnitId, String motivo, String token) {
    return given()
        .contentType(ContentType.JSON)
        .header("Authorization", "Bearer " + token)
        .body(Map.of("toUnitId", toUnitId, "reason", motivo))
        .when()
        .post("/transfers")
        .then()
        .extract()
        .response();
  }

  /** POST /transfers sem toUnitId — para testar 400. */
  public MockMvcResponse solicitarTransferenciaSemToUnitId(
      Long assetId, String motivo, String token) {
    return given()
        .contentType(ContentType.JSON)
        .header("Authorization", "Bearer " + token)
        .body(Map.of("assetId", assetId, "reason", motivo))
        .when()
        .post("/transfers")
        .then()
        .extract()
        .response();
  }

  /** POST /transfers sem reason — para testar 400. */
  public MockMvcResponse solicitarTransferenciaSemMotivo(
      Long assetId, Long toUnitId, String token) {
    return given()
        .contentType(ContentType.JSON)
        .header("Authorization", "Bearer " + token)
        .body(Map.of("assetId", assetId, "toUnitId", toUnitId))
        .when()
        .post("/transfers")
        .then()
        .extract()
        .response();
  }

  /** PATCH /transfers/{id}/approve — aprova transferência pendente. */
  public MockMvcResponse aprovarTransferencia(Long transferId, String comentario, String token) {
    return given()
        .contentType(ContentType.JSON)
        .header("Authorization", "Bearer " + token)
        .body(Map.of("comment", comentario))
        .when()
        .patch("/transfers/{id}/approve", String.valueOf(transferId))
        .then()
        .extract()
        .response();
  }

  /** PATCH /transfers/{id}/reject — rejeita transferência pendente. */
  public MockMvcResponse rejeitarTransferencia(Long transferId, String comentario, String token) {
    return given()
        .contentType(ContentType.JSON)
        .header("Authorization", "Bearer " + token)
        .body(Map.of("comment", comentario))
        .when()
        .patch("/transfers/{id}/reject", String.valueOf(transferId))
        .then()
        .extract()
        .response();
  }

  /** PATCH /transfers/{id}/complete — conclui transferência aprovada. */
  public MockMvcResponse concluirTransferencia(Long transferId, String token) {
    return given()
        .contentType(ContentType.JSON)
        .header("Authorization", "Bearer " + token)
        .when()
        .patch("/transfers/{id}/complete", String.valueOf(transferId))
        .then()
        .extract()
        .response();
  }

  /** PATCH /transfers/{id}/cancel — cancela transferência pendente. */
  public MockMvcResponse cancelarTransferencia(Long transferId, String token) {
    return given()
        .contentType(ContentType.JSON)
        .header("Authorization", "Bearer " + token)
        .when()
        .patch("/transfers/{id}/cancel", String.valueOf(transferId))
        .then()
        .extract()
        .response();
  }

  /** GET /transfers — lista transferências com filtros opcionais. */
  public MockMvcResponse listarTransferencias(
      TransferStatus status, Long assetId, Long unitId, String token) {
    var request =
        given().contentType(ContentType.JSON).header("Authorization", "Bearer " + token);

    if (status != null) {
      request = request.queryParam("status", status.name());
    }
    if (assetId != null) {
      request = request.queryParam("assetId", assetId);
    }
    if (unitId != null) {
      request = request.queryParam("unitId", unitId);
    }

    return request.when().get("/transfers").then().extract().response();
  }
}
