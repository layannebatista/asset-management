package config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.enums.SecuritySchemeType;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import io.swagger.v3.oas.models.servers.ServerVariable;
import io.swagger.v3.oas.models.servers.ServerVariables;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configuração do OpenAPI 3.0 para a API de Gestão de Ativos.
 *
 * <p>Esta classe configura a documentação Swagger/OpenAPI com:
 * - Informações gerais da API
 * - Esquema de autenticação JWT
 * - Servidores (desenvolvimento, staging, produção)
 * - Contato e suporte
 * - Padrão de mercado (similar a Stripe, GitHub, AWS)
 */
@Configuration
public class OpenApiConfig {

  private static final String JWT_BEARER_VALUE = "Bearer";
  private static final String JWT_SCHEME = "JWT";
  private static final String JWT_DESCRIPTION =
      """
      Autenticação via JSON Web Token (JWT).

      **Como obter um token:**
      1. Chame POST /auth/login com credenciais
      2. Copie o campo 'token' da resposta
      3. Adicione o token no header: Authorization: Bearer {token}

      **Token expira em:** 24 horas
      **Renovação:** Chame POST /auth/refresh com seu token antes de expirar

      **Exemplo de header:**
      ```
      Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
      ```
      """;

  /**
   * Cria a configuração OpenAPI com todos os detalhes da API.
   *
   * @return Configuração OpenAPI customizada
   */
  @Bean
  public OpenAPI customOpenAPI() {
    return new OpenAPI()
        .info(buildInfo())
        .servers(buildServers())
        .components(buildComponents())
        .addSecurityItem(new SecurityRequirement().addList(JWT_SCHEME));
  }

  /**
   * Constrói as informações gerais da API.
   *
   * @return Objeto Info com título, versão, descrição, contato e licença
   */
  private Info buildInfo() {
    return new Info()
        .title("🏢 Asset Management API")
        .version("1.0.0")
        .description(buildDescription())
        .contact(buildContact())
        .license(buildLicense());
  }

  /**
   * Descrição detalhada da API em português.
   *
   * @return String com descrição em Markdown
   */
  private String buildDescription() {
    return """
        # Gestão de Ativos Corporativos

        API completa para gerenciamento do ciclo de vida de ativos organizacionais.

        ## 🎯 Funcionalidades Principais

        - **Gestão de Ativos**: Criar, atualizar, deletar e rastrear ativos
        - **Deprecação**: Calcular depreciação automática de ativos
        - **Transferências**: Controlar movimentação de ativos entre unidades
        - **Manutenção**: Agendar e registrar manutenções
        - **Seguros**: Gerenciar coberturas e apólices
        - **Inventário**: Realizar contagens e auditorias
        - **Análise de IA**: Insights automáticos com inteligência artificial
        - **Dashboards**: Executivo, pessoal e por unidade
        - **Auditoria**: Rastrear todas as alterações de ativos

        ## 📊 Domínios Principais

        | Domínio | Descrição | Endpoints |
        |---------|-----------|-----------|
        | **Assets** | Gerenciamento central de ativos | 15+ endpoints |
        | **Depreciation** | Cálculo automático de depreciação | 5+ endpoints |
        | **Transfer** | Rastreamento de movimentação | 8+ endpoints |
        | **Maintenance** | Agendamento e controle de manutenção | 8+ endpoints |
        | **Insurance** | Gestão de seguros e apólices | 6+ endpoints |
        | **Inventory** | Contagens e auditorias | 7+ endpoints |
        | **Dashboard** | Visualizações executivas | 3 endpoints |
        | **AI Insights** | Análise e recomendações com IA | 5+ endpoints |
        | **Organization** | Estrutura organizacional | 6+ endpoints |
        | **User** | Gestão de usuários e permissões | 8+ endpoints |

        ## 🔐 Autenticação

        Todos os endpoints requerem autenticação JWT (Bearer Token).

        **Passos para autenticar:**
        1. POST `/auth/login` com email e senha
        2. Receba o token JWT na resposta
        3. Inclua no header: `Authorization: Bearer {token}`

        **Renovação automática:**
        - Tokens expiram em 24 horas
        - Use `/auth/refresh` para renovar antes da expiração

        ## 📈 Rate Limiting

        - **Limite:** 1000 requisições por hora
        - **Burst:** Até 100 requisições por segundo
        - **Header:** X-RateLimit-Remaining indica requisições restantes
        - **Retry-After:** Se atingir limite, aguarde conforme header

        ## 🔄 Versionamento

        API segue versionamento semântico (SemVer).
        - **Versão atual:** 1.0.0
        - **Breaking changes:** Anunciados com 30 dias de antecedência
        - **Deprecação:** APIs antigas marcadas antes de remover

        ## 💡 Boas Práticas

        - Sempre valide a resposta HTTP
        - Implemente retry com backoff exponencial
        - Use IDs de correlação para debugging
        - Monitore o X-RateLimit-Remaining

        ## 🆘 Suporte

        - **Email:** suporte@portfolio.com
        - **Documentação:** https://docs.portfolio.com
        - **Status:** https://status.portfolio.com

        ---

        **Última atualização:** Abril 2026
        """;
  }

  /**
   * Constrói informações de contato.
   *
   * @return Objeto Contact com nome, email e URL
   */
  private Contact buildContact() {
    return new Contact()
        .name("Tim de Engenharia")
        .email("suporte@portfolio.com")
        .url("https://portfolio.com/suporte");
  }

  /**
   * Constrói informações de licença.
   *
   * @return Objeto License com nome e URL
   */
  private License buildLicense() {
    return new License()
        .name("MIT License")
        .url("https://opensource.org/licenses/MIT");
  }

  /**
   * Constrói lista de servidores (desenvolvimento, staging, produção).
   *
   * @return Lista de servidores com variáveis configuráveis
   */
  private java.util.List<Server> buildServers() {
    return java.util.List.of(
        // Servidor de Desenvolvimento Local
        buildServer(
            "http://localhost:8080",
            "🔨 Desenvolvimento Local",
            "Ambiente local para desenvolvimento e testes"),
        // Servidor de Staging
        buildServer(
            "https://staging-api.portfolio.com",
            "🧪 Staging",
            "Ambiente de testes antes de produção"),
        // Servidor de Produção
        buildServer(
            "https://api.portfolio.com",
            "🚀 Produção",
            "Ambiente de produção - use com cuidado"));
  }

  /**
   * Cria um servidor com descrição.
   *
   * @param url URL do servidor
   * @param description Descrição
   * @param detail Detalhes adicionais
   * @return Objeto Server
   */
  private Server buildServer(String url, String description, String detail) {
    return new Server()
        .url(url)
        .description(description)
        .addVariable("basePath", buildVariable("/api/v1", "Base path da API"));
  }

  /**
   * Cria uma variável de servidor.
   *
   * @param defaultValue Valor padrão
   * @param description Descrição
   * @return Objeto ServerVariable
   */
  private ServerVariable buildVariable(String defaultValue, String description) {
    return new ServerVariable()
        .defaultValue(defaultValue)
        .description(description);
  }

  /**
   * Constrói componentes (schemas, security schemes, etc).
   *
   * @return Objeto Components com definições reutilizáveis
   */
  private Components buildComponents() {
    return new Components()
        // Definir o esquema de autenticação JWT
        .addSecuritySchemes(
            JWT_SCHEME,
            buildJwtSecurityScheme());
  }

  /**
   * Constrói o esquema de segurança JWT.
   *
   * @return Objeto SecurityScheme configurado para JWT
   */
  private SecurityScheme buildJwtSecurityScheme() {
    return new SecurityScheme()
        .type(SecuritySchemeType.HTTP)
        .scheme(JWT_BEARER_VALUE)
        .bearerFormat(JWT_SCHEME)
        .description(JWT_DESCRIPTION)
        .name(JWT_SCHEME);
  }
}
