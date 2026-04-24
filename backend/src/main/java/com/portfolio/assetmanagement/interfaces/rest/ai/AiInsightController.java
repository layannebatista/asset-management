package com.portfolio.assetmanagement.interfaces.rest.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.portfolio.assetmanagement.application.ai.dto.AiAnalysisRequest;
import com.portfolio.assetmanagement.application.ai.service.AiInsightService;
import com.portfolio.assetmanagement.application.ai.service.AiInsightService.AiServiceException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * REST façade for AI Intelligence features.
 *
 * <p>Access control:
 * - ADMIN + GESTOR can trigger analyses (expensive LLM calls)
 * - All authenticated users can read history
 *
 * <p>The actual analysis runs in the ai-intelligence Node.js sidecar.
 * This controller enforces JWT auth + RBAC and proxies the call.
 */
@Tag(name = "AI Intelligence", description = "AI-powered system analysis and insights")
@RestController
@RequestMapping("/api/ai")
public class AiInsightController {

  private final AiInsightService service;
  private final ObjectMapper objectMapper;

  public AiInsightController(AiInsightService service, ObjectMapper objectMapper) {
    this.service = service;
    this.objectMapper = objectMapper;
  }

  @Operation(summary = "Run observability analysis", description = "Analyzes JVM, HTTP, and system metrics for anomalies and bottlenecks")
  @PostMapping("/analysis/observability")
  @PreAuthorize("hasAnyRole('ADMIN', 'GESTOR')")
  public ResponseEntity<JsonNode> observability(@Valid @RequestBody AiAnalysisRequest request) {
    return respond(() -> service.analyze("observability", request));
  }

  @Operation(summary = "Run test intelligence analysis", description = "Detects flaky tests, slow tests, and failure patterns from Allure results")
  @PostMapping("/analysis/test-intelligence")
  @PreAuthorize("hasAnyRole('ADMIN', 'GESTOR')")
  public ResponseEntity<JsonNode> testIntelligence(@Valid @RequestBody AiAnalysisRequest request) {
    return respond(() -> service.analyze("test-intelligence", request));
  }

  @Operation(summary = "Run CI/CD pipeline analysis", description = "Analyzes GitHub Actions workflow performance and failure trends")
  @PostMapping("/analysis/cicd")
  @PreAuthorize("hasAnyRole('ADMIN', 'GESTOR')")
  public ResponseEntity<JsonNode> cicd(@Valid @RequestBody AiAnalysisRequest request) {
    return respond(() -> service.analyze("cicd", request));
  }

  @Operation(summary = "Run incident analysis", description = "Analyzes logs and errors to identify root causes and impacted system layers")
  @PostMapping("/analysis/incident")
  @PreAuthorize("hasAnyRole('ADMIN', 'GESTOR')")
  public ResponseEntity<JsonNode> incident(@Valid @RequestBody AiAnalysisRequest request) {
    return respond(() -> service.analyze("incident", request));
  }

  @Operation(summary = "Run domain risk analysis", description = "Analyzes asset lifecycle data for inconsistencies and risk scenarios")
  @PostMapping("/analysis/risk")
  @PreAuthorize("hasAnyRole('ADMIN', 'GESTOR')")
  public ResponseEntity<JsonNode> risk(@Valid @RequestBody AiAnalysisRequest request) {
    return respond(() -> service.analyze("risk", request));
  }

  @Operation(summary = "Run multi-agent analysis", description = "Runs all 4 specialized agents (DevOps, QA, Backend, Architecture) concurrently")
  @PostMapping("/analysis/multi-agent")
  @PreAuthorize("hasRole('ADMIN')")
  public ResponseEntity<JsonNode> multiAgent() {
    return respond(() -> service.analyze("multi-agent", new AiAnalysisRequest(null, null, null, null, null, null, null, null, null)));
  }

  @Operation(summary = "Get analysis history")
  @GetMapping("/analysis/history")
  @PreAuthorize("isAuthenticated()")
  public ResponseEntity<JsonNode> history(
      @RequestParam(required = false) String type,
      @RequestParam(defaultValue = "20") int limit) {
    try {
      JsonNode history = service.getHistory(type, Math.min(limit, 100));
      return ResponseEntity.ok(history != null ? history : objectMapper.createArrayNode());
    } catch (AiServiceException ex) {
      return ResponseEntity.ok(objectMapper.createArrayNode());
    }
  }

  @Operation(summary = "Get analysis by ID")
  @GetMapping("/analysis/{id}")
  @PreAuthorize("isAuthenticated()")
  public ResponseEntity<JsonNode> getById(@PathVariable String id) {
    JsonNode result = service.getById(id);
    if (result == null) return ResponseEntity.notFound().build();
    return ResponseEntity.ok(result);
  }

  private ResponseEntity<JsonNode> respond(java.util.function.Supplier<JsonNode> action) {
    try {
      JsonNode result = action.get();
      if (result == null) return ResponseEntity.notFound().build();
      return ResponseEntity.ok(result);
    } catch (AiServiceException ex) {
      return ResponseEntity.status(ex.getStatusCode()).build();
    }
  }
}
