package com.portfolio.assetmanagement.bdd;

import static io.cucumber.junit.platform.engine.Constants.GLUE_PROPERTY_NAME;
import static io.cucumber.junit.platform.engine.Constants.PLUGIN_PROPERTY_NAME;

import org.junit.platform.suite.api.ConfigurationParameter;
import org.junit.platform.suite.api.IncludeEngines;
import org.junit.platform.suite.api.SelectClasspathResource;
import org.junit.platform.suite.api.Suite;

/**
 * CAMADA 3 — Runner do Cucumber.
 *
 * <p>Este é o único ponto de entrada para todos os testes BDD. O JUnit Platform Suite descobre e
 * executa todos os .feature files a partir do diretório configurado em @SelectClasspathResource.
 *
 * <p>COMO FUNCIONA: - @Suite + @IncludeEngines("cucumber") = JUnit delega execução ao Cucumber
 * - @SelectClasspathResource("features") = busca todos .feature em src/test/resources/features/ -
 * GLUE_PROPERTY_NAME = pacote onde estão todos os @Step definitions e @CucumberContextConfiguration
 * - PLUGIN_PROPERTY_NAME = relatórios gerados (pretty no console + json para Allure)
 *
 * <p>PARA RODAR SÓ UMA FEATURE: Descomente e ajuste o @ConfigurationParameter de
 * FILTER_TAGS_PROPERTY_NAME Ex: @ConfigurationParameter(key = FILTER_TAGS_PROPERTY_NAME, value =
 * "@maintenance")
 */
@Suite
@IncludeEngines("cucumber")
@SelectClasspathResource("features")
@ConfigurationParameter(key = GLUE_PROPERTY_NAME, value = "com.portfolio.assetmanagement.bdd")
@ConfigurationParameter(
    key = PLUGIN_PROPERTY_NAME,
    value =
        "pretty, io.qameta.allure.cucumber7jvm.AllureCucumber7Jvm, json:target/cucumber-reports/cucumber.json")
// Descomente para rodar apenas cenários com uma tag específica:
// @ConfigurationParameter(key = FILTER_TAGS_PROPERTY_NAME, value = "@maintenance")
public class CucumberTestSuite {}
