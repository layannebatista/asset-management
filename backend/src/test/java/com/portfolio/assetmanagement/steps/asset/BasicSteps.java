package com.portfolio.assetmanagement.steps.asset;

import static org.junit.jupiter.api.Assertions.assertTrue;

import io.cucumber.java.en.Then;

public class BasicSteps {

  @Then("o teste deve executar corretamente")
  public void basicValidation() {
    assertTrue(true);
  }
}
