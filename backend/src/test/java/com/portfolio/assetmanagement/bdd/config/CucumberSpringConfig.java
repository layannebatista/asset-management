package com.portfolio.assetmanagement.bdd.config;

import com.portfolio.assetmanagement.AssetManagementApplication;
import io.cucumber.spring.CucumberContextConfiguration;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

/**
 * CAMADA 3 — Configuração Spring para o Cucumber.
 *
 * <p>Esta classe faz UMA única coisa: dizer ao Cucumber como iniciar o contexto Spring.
 *
 * <p>POR QUE @CucumberContextConfiguration AQUI? O Cucumber precisa saber qual classe tem a
 * configuração do Spring. Deve haver exatamente UMA classe com @CucumberContextConfiguration em
 * todo o projeto. Se existir mais de uma, o Cucumber lança erro na inicialização.
 *
 * <p>POR QUE WebEnvironment.MOCK? - Não sobe porta HTTP real (mais rápido, sem conflito de porta) -
 * RestAssuredMockMvc usa o MockMvc internamente - Filtros de segurança (JWT) continuam funcionando
 * normalmente - Testcontainers sobe o PostgreSQL real via application-test.yml
 *
 * <p>POR QUE @ActiveProfiles("test")? Ativa o application-test.yml que tem: - Testcontainers como
 * datasource (jdbc:tc:postgresql:15:///) - JWT secret fixo para testes - Flyway habilitado com as 4
 * migrations reais
 */
@CucumberContextConfiguration
@SpringBootTest(
    classes = AssetManagementApplication.class,
    webEnvironment = SpringBootTest.WebEnvironment.MOCK)
@ActiveProfiles("test")
public class CucumberSpringConfig {}
