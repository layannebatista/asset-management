package com.portfolio.assetmanagement.service.ai;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.portfolio.assetmanagement.application.ai.dto.AiAnalysisRequest;
import com.portfolio.assetmanagement.application.ai.service.AiInsightService;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@DisplayName("AiInsightService — resiliência")
class AiInsightServiceTest {

  @Test
  @DisplayName("AI-S01 - serviço indisponível lança AiServiceException")
  void servicoIndisponivelLancaAiServiceException() {
    AiInsightService service = new AiInsightService("http://127.0.0.1:1", "test-key");

    AiAnalysisRequest req =
        new AiAnalysisRequest(
            30,
            "asset-management",
            "backend",
            7,
            List.of("Timeout em endpoint"),
            List.of("Connection refused"),
            30,
            List.of("inventory"),
            List.of("AST-001"));

    assertThatThrownBy(() -> service.analyze("risk", req))
        .isInstanceOf(AiInsightService.AiServiceException.class);
  }
}
