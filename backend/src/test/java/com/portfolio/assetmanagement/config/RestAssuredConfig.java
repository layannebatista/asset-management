package com.portfolio.assetmanagement.config;

import io.cucumber.java.Before;
import io.restassured.RestAssured;

public class RestAssuredConfig {

  @Before
  public void setup() {
    RestAssured.baseURI = "http://localhost:8080";
  }
}
