package com.portfolio.assetmanagement;

import io.restassured.RestAssured;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class AssetIntegrationTest {

  @LocalServerPort private int port;

  @BeforeEach
  void setup() {
    RestAssured.port = port;
  }

  @Test
  void healthCheck() {

    RestAssured.given().basePath("/actuator").when().get("/health").then().statusCode(200);
  }
}
