package com.portfolio.assetmanagement.bdd.steps;

import static org.assertj.core.api.Assertions.assertThat;

import com.portfolio.assetmanagement.bdd.client.ApiClient;
import com.portfolio.assetmanagement.bdd.context.ScenarioContext;
import com.portfolio.assetmanagement.bdd.support.TestDataHelper;
import com.portfolio.assetmanagement.domain.asset.entity.Asset;
import com.portfolio.assetmanagement.domain.organization.entity.Organization;
import com.portfolio.assetmanagement.domain.unit.entity.Unit;
import com.portfolio.assetmanagement.infrastructure.persistence.asset.repository.AssetRepository;
import io.cucumber.java.Before;
import io.cucumber.java.pt.Dado;
import io.cucumber.java.pt.E;
import io.cucumber.java.pt.Então;
import io.cucumber.java.pt.Quando;
import io.restassured.module.mockmvc.response.MockMvcResponse;
import java.util.HashMap;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;

/**
 * CAMADA 3 — Step Definitions para a feature de Manutenção.
 *
 * <p>Cada método anotado com @Dado/@Quando/@Então/@E corresponde a uma linha do arquivo
 * maintenance.feature. O texto entre aspas no feature deve bater EXATAMENTE com a expressão regular
 * ou cucumber expression do step.
 *
 * <p>INJEÇÃO DE DEPENDÊNCIAS: O Cucumber com cucumber-spring injeta beans Spring normalmente
 * via @Autowired. O contexto Spring é iniciado pela CucumberSpringConfig
 * (@CucumberContextConfiguration).
 *
 * <p>ESTADO ENTRE STEPS: Tudo que precisa ser compartilhado entre steps usa o ScenarioContext.
 * Nunca use campos estáticos ou instância direta — o @ScenarioScope garante isolamento por cenário.
 *
 * <p>COMO REPLICAR PARA OUTROS DOMÍNIOS: 1. Crie o arquivo .feature com os cenários do domínio 2.
 * Crie o *Steps.java no mesmo pacote steps/ 3. Injete ApiClient, ScenarioContext, TestDataHelper 4.
 * Cada @Dado configura estado inicial, @Quando chama ApiClient, @Então faz asserts
 */
public class MaintenanceSteps {

  @Autowired private ApiClient apiClient;
  @Autowired private ScenarioContext context;
  @Autowired private TestDataHelper testDataHelper;
  @Autowired private AssetRepository assetRepository;

  // Estado local do cenário — organizações, unidades, ativos criados no Contexto
  private Organization organizacao;
  private Unit unidade;
  private final Map<String, Asset> ativos = new HashMap<>();

  // =========================================================
  // SETUP — executa antes de cada cenário desta feature
  // =========================================================

  @Before
  public void limparBanco() {
    testDataHelper.cleanDatabase();
  }

  // =========================================================
  // CONTEXTO — passos do bloco "Contexto:" do feature
  // Executados antes de cada cenário
  // =========================================================

  @Dado("que existe uma organização {string} cadastrada")
  public void queExisteUmaOrganizacao(String nome) {
    organizacao = testDataHelper.criarOrganizacao(nome);
    context.setId("organizacaoId", organizacao.getId());
  }

  @E("que existe uma unidade {string} nessa organização")
  public void queExisteUmaUnidade(String nome) {
    unidade = testDataHelper.criarUnidade(nome, organizacao);
    context.setId("unidadeId", unidade.getId());
  }

  @E("que existe um ativo {string} disponível nessa unidade")
  public void queExisteUmAtivoDisponivel(String assetTag) {
    Asset ativo =
        testDataHelper.criarAtivo(
            assetTag,
            com.portfolio.assetmanagement.domain.asset.enums.AssetType.NOTEBOOK,
            organizacao,
            unidade);
    ativos.put(assetTag, ativo);
    context.setId("ativoId_" + assetTag, ativo.getId());
  }

  @E("que existe um usuário ADMIN com email {string} e senha {string}")
  public void queExisteAdmin(String email, String senha) {
    testDataHelper.criarAdmin(email, senha, organizacao, unidade);
  }

  @E("que existe um usuário GESTOR com email {string} e senha {string}")
  public void queExisteGestor(String email, String senha) {
    testDataHelper.criarGestor(email, senha, organizacao, unidade);
  }

  @E("que existe um usuário OPERADOR com email {string} e senha {string}")
  public void queExisteOperador(String email, String senha) {
    testDataHelper.criarOperador(email, senha, organizacao, unidade);
  }

  @E("que existe um ativo {string} em manutenção nessa unidade")
  public void queExisteAtivoEmManutencao(String assetTag) {
    Asset ativo = testDataHelper.criarAtivoEmManutencao(organizacao, unidade);
    ativos.put(assetTag, ativo);
  }

  @E("que existe um ativo {string} aposentado nessa unidade")
  public void queExisteAtivoAposentado(String assetTag) {
    Asset ativo = testDataHelper.criarAtivoAposentado(organizacao, unidade);
    ativos.put(assetTag, ativo);
  }

  @E("que existe um ativo {string} em transferência nessa unidade")
  public void queExisteAtivoEmTransferencia(String assetTag) {
    Asset ativo = testDataHelper.criarAtivoEmTransferencia(organizacao, unidade);
    ativos.put(assetTag, ativo);
    context.setId("ativoId_" + assetTag, ativo.getId());
  }

  // =========================================================
  // AUTENTICAÇÃO
  // =========================================================

  @Dado("que estou autenticado como {string} com senha {string}")
  public void queEstouAutenticado(String email, String senha) {
    MockMvcResponse response = apiClient.login(email, senha);

    // Garante que o login funcionou antes de continuar
    assertThat(response.statusCode())
        .as("Login falhou para o usuário %s — verifique se o TestDataHelper criou o usuário", email)
        .isEqualTo(200);

    String token = response.path("accessToken");
    assertThat(token).as("Token JWT não encontrado na resposta de login").isNotBlank();

    context.setToken(token);
  }

  // =========================================================
  // SETUP AVANÇADO — passos de "E que..." dentro dos cenários
  // =========================================================

  @E("que criei uma manutenção para o ativo {string} com descrição {string}")
  public void queCriei(String assetTag, String descricao) {
    Asset ativo = ativos.get(assetTag);
    MockMvcResponse response =
        apiClient.criarManutencao(ativo.getId(), descricao, context.getToken());

    assertThat(response.statusCode())
        .as("Falha ao criar manutenção no setup do cenário")
        .isEqualTo(201);

    Long manutencaoId = ((Number) response.path("id")).longValue();
    context.setLastCreatedId(manutencaoId);
    context.setId("manutencaoId", manutencaoId);
  }

  @E("que iniciei essa manutenção")
  public void queIniciei() {
    MockMvcResponse response =
        apiClient.iniciarManutencao(context.getLastCreatedId(), context.getToken());
    assertThat(response.statusCode())
        .as("Falha ao iniciar manutenção no setup do cenário")
        .isEqualTo(200);
  }

  @E("que concluí essa manutenção com resolução {string}")
  public void queConclui(String resolucao) {
    MockMvcResponse response =
        apiClient.concluirManutencao(context.getLastCreatedId(), resolucao, context.getToken());
    assertThat(response.statusCode())
        .as("Falha ao concluir manutenção no setup do cenário")
        .isEqualTo(200);
  }

  @E("que cancelei essa manutenção")
  public void queCanceleiEssaManutencao() {
    MockMvcResponse response =
        apiClient.cancelarManutencao(context.getLastCreatedId(), context.getToken());
    assertThat(response.statusCode())
        .as("Falha ao cancelar manutenção no setup do cenário")
        .isEqualTo(200);
  }

  // =========================================================
  // AÇÕES — passos do "Quando"
  // =========================================================

  @Quando("solicito manutenção para o ativo {string} com descrição longa de {int} caracteres")
  public void solicitoManutencaoComDescricaoLonga(String assetTag, int tamanho) {
    Asset ativo = ativos.get(assetTag);
    assertThat(ativo).as("Ativo '%s' não foi criado no Contexto do cenário", assetTag).isNotNull();

    String descricaoLonga = "A".repeat(tamanho);
    MockMvcResponse response =
        apiClient.criarManutencao(ativo.getId(), descricaoLonga, context.getToken());
    context.setLastResponse(response);
  }

  @Quando("solicito manutenção para o ativo {string} com custo estimado inválido de {double}")
  public void solicitoManutencaoComCustoInvalido(String assetTag, double custo) {
    Asset ativo = ativos.get(assetTag);
    assertThat(ativo).as("Ativo '%s' não foi criado no Contexto do cenário", assetTag).isNotNull();

    MockMvcResponse response =
        apiClient.criarManutencaoComCusto(ativo.getId(), "Descrição mínima para custo inválido", custo, context.getToken());
    context.setLastResponse(response);
  }

  @Quando("concluo a manutenção salva sem enviar resolution")
  public void concluoAManutencaoSalvaSemEnviarResolution() {
    MockMvcResponse response =
        apiClient.concluirManutencaoSemResolucao(context.getLastCreatedId(), context.getToken());
    context.setLastResponse(response);
  }

  @Quando("solicito manutenção para o ativo {string} com descrição {string}")
  public void solicitoManutencao(String assetTag, String descricao) {
    Asset ativo = ativos.get(assetTag);
    assertThat(ativo).as("Ativo '%s' não foi criado no Contexto do cenário", assetTag).isNotNull();

    MockMvcResponse response =
        apiClient.criarManutencao(ativo.getId(), descricao, context.getToken());
    context.setLastResponse(response);

    // Salva o ID se a criação foi bem-sucedida (para steps seguintes)
    if (response.statusCode() == 201) {
      Long manutencaoId = ((Number) response.path("id")).longValue();
      context.setLastCreatedId(manutencaoId);
    }
  }

  @Quando("inicio a manutenção salva")
  public void inicioAManutencaoSalva() {
    MockMvcResponse response =
        apiClient.iniciarManutencao(context.getLastCreatedId(), context.getToken());
    context.setLastResponse(response);
  }

  @Quando("concluo a manutenção salva com resolução {string}")
  public void concluoAManutencaoSalva(String resolucao) {
    MockMvcResponse response =
        apiClient.concluirManutencao(context.getLastCreatedId(), resolucao, context.getToken());
    context.setLastResponse(response);
  }

  @Quando("cancelo a manutenção salva")
  public void canceloAManutencaoSalva() {
    MockMvcResponse response =
        apiClient.cancelarManutencao(context.getLastCreatedId(), context.getToken());
    context.setLastResponse(response);
  }

  // =========================================================
  // VERIFICAÇÕES — passos do "Então" e "E" após ações
  // =========================================================

  @Então("a resposta deve ter status {int}")
  public void aRespostaDeveTerStatus(int statusEsperado) {
    assertThat(context.getLastResponse().statusCode())
        .as(
            "Status HTTP incorreto. Body da resposta: %s",
            context.getLastResponse().getBody().asString())
        .isEqualTo(statusEsperado);
  }

  @E("o status da manutenção deve ser {string}")
  public void oStatusDaManutencaoDeveSer(String statusEsperado) {
    String statusAtual = context.getLastResponse().path("status");
    assertThat(statusAtual).as("Status da manutenção incorreto").isEqualTo(statusEsperado);
  }

  @E("a mensagem de erro deve conter {string}")
  public void aMensagemDeErroDeveConter(String textoEsperado) {
    String body = context.getLastResponse().getBody().asString();
    assertThat(body)
        .as("Mensagem de erro não contém o texto esperado '%s'. Body: %s", textoEsperado, body)
        .containsIgnoringCase(textoEsperado);
  }

  @E("salvo o ID da manutenção criada")
  public void salvoOIdDaManutencaoCriada() {
    Number raw = context.getLastResponse().path("id");
    assertThat(raw).as("ID da manutenção não encontrado na resposta").isNotNull();
    context.setLastCreatedId(raw.longValue());
  }

  @E("o ativo {string} deve ter status {string}")
  public void oAtivoDeveTerStatus(String assetTag, String statusEsperado) {
    Asset ativo = ativos.get(assetTag);

    // Busca o ativo atualizado do banco para verificar o status real
    Asset ativoAtualizado =
        assetRepository
            .findById(ativo.getId())
            .orElseThrow(() -> new AssertionError("Ativo não encontrado no banco: " + assetTag));

    assertThat(ativoAtualizado.getStatus().name())
        .as("Status do ativo '%s' incorreto", assetTag)
        .isEqualTo(statusEsperado);
  }
}
