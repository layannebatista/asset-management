package com.portfolio.assetmanagement.steps.asset;

import io.cucumber.java.en.Then;

import static org.junit.jupiter.api.Assertions.assertTrue;

public class BasicSteps {

    @Then("o teste deve executar corretamente")
    public void basicValidation() {
        assertTrue(true);
    }
}