package com.portfolio.assetmanagement.architecture;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.classes;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;

import com.tngtech.archunit.core.domain.JavaClasses;
import com.tngtech.archunit.core.importer.ClassFileImporter;
import com.tngtech.archunit.core.importer.ImportOption;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import io.qameta.allure.Severity;
import io.qameta.allure.SeverityLevel;
import io.qameta.allure.Story;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

/**
 * CAMADA 4 — Testes de Arquitetura com ArchUnit.
 *
 * <p>Verificam que as regras de separação de camadas nunca são violadas, independente de quem
 * adicionar código novo ao projeto.
 *
 * <p>POR QUE ISSO É IMPORTANTE? Sem esse teste, um desenvolvedor pode acidentalmente importar uma
 * entidade de domínio em uma interface HTTP, ou chamar um repositório diretamente de um controller
 * — e ninguém percebe até o sistema ficar difícil de manter. Com ArchUnit, a violação quebra o
 * build imediatamente.
 *
 * <p>COMO FUNCIONA: - ClassFileImporter lê os .class compilados (não o código fonte) - As regras
 * são expressas em fluent API legível - Qualquer violação é reportada com o nome exato da classe e
 * linha
 *
 * <p>PADRÃO PARA REPLICAR: - Adicione regras em novos @Test methods - Use
 * noClasses().that()...should() para proibir algo - Use classes().that()...should() para exigir
 * algo - Sempre adicione .because("explicação do motivo") para documentar
 */
@Epic("Backend")
@Feature("Arquitetura — Camadas")
@DisplayName("[CONFIG][ASSET] Dependências entre Camadas")
@Tag("testType=Architecture")
@Tag("module=General")
class LayerDependencyTest {

  private static final String PACOTE_BASE = "com.portfolio.assetmanagement";

  private static final String PACOTE_DOMAIN = PACOTE_BASE + ".domain..";
  private static final String PACOTE_APPLICATION = PACOTE_BASE + ".application..";
  private static final String PACOTE_INTERFACES = PACOTE_BASE + ".interfaces..";
  private static final String PACOTE_INFRA = PACOTE_BASE + ".infrastructure..";
  private static final String PACOTE_SHARED = PACOTE_BASE + ".shared..";
  private static final String PACOTE_SECURITY = PACOTE_BASE + ".security..";

  private static JavaClasses classes;

  @BeforeAll
  static void importarClasses() {
    // ImportOption.DoNotIncludeTests — exclui classes de teste da análise
    // Sem isso, as próprias classes de teste quebrariam as regras
    classes =
        new ClassFileImporter()
            .withImportOption(ImportOption.Predefined.DO_NOT_INCLUDE_TESTS)
            .importPackages(PACOTE_BASE);
  }

  // =========================================================
  // DOMAIN — a camada mais interna, não depende de ninguém
  // =========================================================

  @Test
  @Story("Dependências de camada")
  @Severity(SeverityLevel.BLOCKER)
  @DisplayName("[CONFIG][ASSET] Domain não deve importar classes de Application")
  void domainNaoDeveImportarApplication() {
    noClasses()
        .that()
        .resideInAPackage(PACOTE_DOMAIN)
        .should()
        .dependOnClassesThat()
        .resideInAPackage(PACOTE_APPLICATION)
        .because(
            "O domínio contém as regras de negócio puras. "
                + "Importar Application criaria dependência circular e violaria DDD.")
        .check(classes);
  }

  @Test
  @Story("Dependências de camada")
  @Severity(SeverityLevel.BLOCKER)
  @DisplayName("[CONFIG][ASSET] Domain não deve importar classes de Interfaces (controllers)")
  void domainNaoDeveImportarInterfaces() {
    noClasses()
        .that()
        .resideInAPackage(PACOTE_DOMAIN)
        .should()
        .dependOnClassesThat()
        .resideInAPackage(PACOTE_INTERFACES)
        .because(
            "O domínio não pode conhecer a camada de apresentação. "
                + "Isso garantiria que o domínio seja portável e testável de forma isolada.")
        .check(classes);
  }

  @Test
  @Story("Dependências de camada")
  @Severity(SeverityLevel.BLOCKER)
  @DisplayName("[CONFIG][ASSET] Domain não deve importar classes de Infrastructure")
  void domainNaoDeveImportarInfrastructure() {
    noClasses()
        .that()
        .resideInAPackage(PACOTE_DOMAIN)
        .should()
        .dependOnClassesThat()
        .resideInAPackage(PACOTE_INFRA)
        .because(
            "O domínio não pode depender de detalhes de persistência (JPA, SQL). "
                + "Repositórios devem ser injetados via interfaces, não acessados diretamente.")
        .check(classes);
  }

  // =========================================================
  // APPLICATION — depende só de domain e shared
  // =========================================================

  @Test
  @Story("Dependências de camada")
  @Severity(SeverityLevel.BLOCKER)
  @DisplayName("[CONFIG][ASSET] Application não deve importar classes de Interfaces (controllers)")
  void applicationNaoDeveImportarInterfaces() {
    noClasses()
        .that()
        .resideInAPackage(PACOTE_APPLICATION)
        .should()
        .dependOnClassesThat()
        .resideInAPackage(PACOTE_INTERFACES)
        .because(
            "Services de aplicação não devem conhecer controllers. "
                + "O fluxo é sempre: controller → service, nunca o contrário.")
        .check(classes);
  }

  // =========================================================
  // INTERFACES — depende de application, nunca de infra diretamente
  // =========================================================

  @Test
  @Story("Convenções de nomenclatura")
  @Severity(SeverityLevel.CRITICAL)
  @DisplayName("[CONFIG][ASSET] Controllers não devem importar repositórios diretamente")
  void controllersNaoDevemImportarRepositorios() {
    // ATENÇÃO: Esta regra detectou uma violação REAL no AssetHistoryController,
    // que injeta AssetStatusHistoryRepository e AssetAssignmentHistoryRepository diretamente.
    // A correção correta é criar um AssetHistoryQueryService que encapsule esses repositórios
    // e o controller passe a depender apenas do service.
    noClasses()
        .that()
        .resideInAPackage(PACOTE_INTERFACES)
        .should()
        .dependOnClassesThat()
        .resideInAPackage(PACOTE_INFRA)
        .because(
            "Controllers devem falar apenas com Services. "
                + "Acesso direto a repositórios em controllers quebra o isolamento de camadas "
                + "e dificulta testes unitários.")
        .check(classes);
  }

  // =========================================================
  // NAMING CONVENTIONS — garantem consistência do projeto
  // =========================================================

  @Test
  @Story("Convenções de nomenclatura")
  @Severity(SeverityLevel.NORMAL)
  @DisplayName("[CONFIG][ASSET] Classes em interfaces/rest devem terminar com Controller")
  void controllerDevemTerminarComController() {
    classes()
        .that()
        .resideInAPackage(PACOTE_INTERFACES)
        .and()
        .areAnnotatedWith(org.springframework.web.bind.annotation.RestController.class)
        .should()
        .haveSimpleNameEndingWith("Controller")
        .because(
            "Convenção de nomenclatura: todos os controllers REST devem "
                + "ser facilmente identificados pelo sufixo Controller.")
        .check(classes);
  }

  @Test
  @Story("Convenções de nomenclatura")
  @Severity(SeverityLevel.NORMAL)
  @DisplayName("[CONFIG][ASSET] Classes anotadas com @Repository devem terminar com Repository")
  void repositoriosDevemTerminarComRepository() {
    classes()
        .that()
        .areAnnotatedWith(org.springframework.stereotype.Repository.class)
        .should()
        .haveSimpleNameEndingWith("Repository")
        .because(
            "Convenção de nomenclatura: repositórios JPA devem "
                + "ser facilmente identificados pelo sufixo Repository.")
        .check(classes);
  }

  @Test
  @Story("Convenções de nomenclatura")
  @Severity(SeverityLevel.NORMAL)
  @DisplayName("[CONFIG][ASSET] Classes anotadas com @Service devem terminar com Service")
  void servicosDevemTerminarComService() {
    classes()
        .that()
        .areAnnotatedWith(org.springframework.stereotype.Service.class)
        // Exceção: UserDetailsServiceImpl implementa interface do Spring Security
        // e precisa manter esse nome por convenção do framework
        .and()
        .doNotHaveSimpleName("UserDetailsServiceImpl")
        .should()
        .haveSimpleNameEndingWith("Service")
        .because(
            "Convenção de nomenclatura: services Spring devem "
                + "ser facilmente identificados pelo sufixo Service.")
        .check(classes);
  }

  // =========================================================
  // ENTIDADES DE DOMÍNIO — não devem vazar para a camada HTTP
  // =========================================================

  @Test
  @Story("Dependências de camada")
  @Severity(SeverityLevel.BLOCKER)
  @DisplayName("[CONFIG][ASSET] Controllers não devem retornar entidades de domínio diretamente")
  void controllersNaoDevemRetornarEntidadesDeDominio() {
    // Verifica usando noMethods() — API disponível no ArchUnit 1.2.1
    // Impede que métodos de controllers retornem tipos anotados com @Entity
    com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noMethods()
        .that()
        .areDeclaredInClassesThat()
        .resideInAPackage(PACOTE_INTERFACES)
        .and()
        .areDeclaredInClassesThat()
        .areAnnotatedWith(org.springframework.web.bind.annotation.RestController.class)
        .should()
        .haveRawReturnType(
            com.tngtech.archunit.core.domain.JavaClass.Predicates.resideInAPackage(PACOTE_DOMAIN))
        .because(
            "Controllers devem retornar DTOs, nunca entidades de domínio diretamente. "
                + "Expor entidades na API acopla o contrato público ao modelo de dados.")
        .check(classes);
  }
}
