package com.portfolio.assetmanagement.bdd.runner;

import static io.cucumber.junit.platform.engine.Constants.GLUE_PROPERTY_NAME;
import static io.cucumber.junit.platform.engine.Constants.PLUGIN_PROPERTY_NAME;

import org.junit.platform.suite.api.ConfigurationParameter;
import org.junit.platform.suite.api.IncludeEngines;
import org.junit.platform.suite.api.SelectClasspathResource;
import org.junit.platform.suite.api.Suite;

/**
 * Runner oficial do Cucumber — descoberto automaticamente pelo Maven Surefire.
 *
 * <p>O nome "CucumberRunnerTest" segue a convenção *Test, garantindo que o Surefire
 * inclua esta classe na execução de `mvn verify` sem configuração adicional.
 *
 * <p>DIFERENÇA em relação ao CucumberTestSuite: aquele usa sufixo "Suite" que o
 * Surefire ignora por padrão. Este usa sufixo "Test" e é descoberto automaticamente.
 *
 * <p>Todas as features em src/test/resources/features/ são descobertas automaticamente,
 * incluindo maintenance/ e asset/.
 */
@Suite
@IncludeEngines("cucumber")
@SelectClasspathResource("features")
@ConfigurationParameter(key = GLUE_PROPERTY_NAME, value = "com.portfolio.assetmanagement.bdd")
@ConfigurationParameter(
    key = PLUGIN_PROPERTY_NAME,
    value =
        "pretty, io.qameta.allure.cucumber7jvm.AllureCucumber7Jvm,"
            + " json:target/cucumber-reports/cucumber.json")
public class CucumberRunnerTest {}
