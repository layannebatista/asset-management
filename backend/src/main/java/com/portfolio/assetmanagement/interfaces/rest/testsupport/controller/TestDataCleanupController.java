package com.portfolio.assetmanagement.interfaces.rest.testsupport.controller;

import com.portfolio.assetmanagement.application.testsupport.service.TestDataCleanupService;
import io.swagger.v3.oas.annotations.Hidden;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@Hidden
@RestController
@RequestMapping("/test-support")
@ConditionalOnProperty(value = "app.test-support.cleanup.enabled", havingValue = "true")
public class TestDataCleanupController {

  private final TestDataCleanupService cleanupService;

  @Value("${app.test-support.cleanup.key:}")
  private String cleanupKey;

  public TestDataCleanupController(TestDataCleanupService cleanupService) {
    this.cleanupService = cleanupService;
  }

  @PostMapping("/cleanup")
  @PreAuthorize("hasRole('ADMIN')")
  public ResponseEntity<Map<String, Object>> cleanup(
      @RequestHeader(name = "X-Test-Cleanup-Key", required = false) String providedKey) {

    if (cleanupKey == null || cleanupKey.isBlank()) {
      throw new ResponseStatusException(
          HttpStatus.FORBIDDEN, "Test data cleanup is not configured");
    }

    if (!cleanupKey.equals(providedKey)) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Invalid cleanup key");
    }

    cleanupService.cleanupAndReseed();

    return ResponseEntity.ok(Map.of("status", "ok", "message", "Test data cleaned and reseeded"));
  }
}
