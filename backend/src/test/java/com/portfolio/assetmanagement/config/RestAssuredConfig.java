package com.portfolio.assetmanagement.config;

import io.restassured.RestAssured;
import io.cucumber.java.Before;

public class RestAssuredConfig {

    @Before
    public void setup() {
        RestAssured.baseURI = "http://localhost:8080";
    }
}