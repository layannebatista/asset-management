package com.portfolio.assetmanagement.application.ai.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.portfolio.assetmanagement.application.ai.dto.AiAnalysisRequest;
import java.time.Duration;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.util.UriComponentsBuilder;

/**
 * Proxy service that delegates AI analysis requests to the ai-intelligence Node.js service.
 *
 * <p>Uses {@link RestClient} (Spring Boot 3.2+, synchronous) — no WebFlux dependency needed. The
 * frontend calls Spring Boot (JWT + RBAC enforced), which forwards to the AI sidecar using the
 * internal API key, keeping the AI service unreachable from external clients.
 */
@Service
public class AiInsightService {

  private static final Logger log = LoggerFactory.getLogger(AiInsightService.class);

  private static final int ANALYSIS_TIMEOUT_MS = 180_000; // 3 min — LLM calls are slow
  private static final int QUERY_TIMEOUT_MS = 10_000;

  private final RestClient analysisClient;
  private final RestClient queryClient;

  public AiInsightService(
      @Value("${ai.service.url:http://ai-intelligence:3100}") String aiServiceUrl,
      @Value("${ai.service.api-key:}") String apiKey) {

    this.analysisClient = buildClient(aiServiceUrl, apiKey, ANALYSIS_TIMEOUT_MS);
    this.queryClient = buildClient(aiServiceUrl, apiKey, QUERY_TIMEOUT_MS);
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  public JsonNode analyze(String analysisType, AiAnalysisRequest request) {
    log.info("Dispatching AI analysis: type={}", analysisType);

    try {
      return analysisClient
          .post()
          .uri("/api/v1/analysis/{type}", analysisType)
          .contentType(MediaType.APPLICATION_JSON)
          .body(request)
          .retrieve()
          .onStatus(
              HttpStatusCode::isError,
              (req, res) -> {
                int code = res.getStatusCode().value();
                log.error("AI service error: status={} uri={}", code, req.getURI());
                throw new AiServiceException("AI analysis failed with status " + code, code);
              })
          .body(JsonNode.class);

    } catch (AiServiceException ex) {
      throw ex;
    } catch (RestClientResponseException ex) {
      log.error("AI service HTTP error: status={}", ex.getStatusCode().value(), ex);
      throw new AiServiceException(
          "AI analysis failed: " + ex.getStatusCode(), ex.getStatusCode().value());
    } catch (Exception ex) {
      log.error("AI service unreachable", ex);
      throw new AiServiceException("AI service unavailable", 503);
    }
  }

  public JsonNode getHistory(String type, int limit) {
    try {
      // Build URI explicitly to avoid null template-variable bugs
      String uri =
          UriComponentsBuilder.fromUriString("/api/v1/analysis/history")
              .queryParamIfPresent("type", java.util.Optional.ofNullable(type))
              .queryParam("limit", limit)
              .build()
              .toUriString();

      return queryClient
          .get()
          .uri(uri)
          .retrieve()
          .onStatus(
              HttpStatusCode::isError,
              (req, res) -> {
                throw new AiServiceException(
                    "Failed to fetch history", res.getStatusCode().value());
              })
          .body(JsonNode.class);

    } catch (AiServiceException ex) {
      throw ex;
    } catch (Exception ex) {
      log.error("Failed to fetch AI analysis history", ex);
      throw new AiServiceException("AI service unavailable", 503);
    }
  }

  public JsonNode getById(String analysisId) {
    try {
      return queryClient
          .get()
          .uri("/api/v1/analysis/{id}", analysisId)
          .retrieve()
          .onStatus(
              status -> status.value() == 404,
              (req, res) -> {
                /* return null below */
              })
          .onStatus(
              HttpStatusCode::isError,
              (req, res) -> {
                throw new AiServiceException(
                    "Failed to fetch analysis", res.getStatusCode().value());
              })
          .body(JsonNode.class);

    } catch (AiServiceException ex) {
      if (ex.getStatusCode() == 404) return null;
      throw ex;
    } catch (Exception ex) {
      log.error("Failed to fetch analysis by id={}", analysisId, ex);
      throw new AiServiceException("AI service unavailable", 503);
    }
  }

  // ─── Builder ──────────────────────────────────────────────────────────────

  private static RestClient buildClient(String baseUrl, String apiKey, int timeoutMs) {
    SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
    factory.setConnectTimeout(Duration.ofSeconds(10));
    factory.setReadTimeout(Duration.ofMillis(timeoutMs));

    return RestClient.builder()
        .baseUrl(baseUrl)
        .requestFactory(factory)
        .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
        .defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
        .defaultHeader("X-AI-Service-Key", apiKey)
        .build();
  }

  // ─── Exception ────────────────────────────────────────────────────────────

  public static class AiServiceException extends RuntimeException {
    private final int statusCode;

    public AiServiceException(String message, int statusCode) {
      super(message);
      this.statusCode = statusCode;
    }

    public int getStatusCode() {
      return statusCode;
    }
  }
}
