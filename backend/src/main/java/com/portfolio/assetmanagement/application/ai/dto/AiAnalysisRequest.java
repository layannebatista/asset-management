package com.portfolio.assetmanagement.application.ai.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record AiAnalysisRequest(

    // ─── Observability ────────────────────────────────────────────────────────
    @Min(5) @Max(1440) Integer windowMinutes,

    // ─── Test Intelligence ────────────────────────────────────────────────────
    String projectId,
    String suite, // backend | frontend | all

    // ─── CI/CD ────────────────────────────────────────────────────────────────
    @Min(1) @Max(30) Integer lookbackDays,

    // ─── Incident ─────────────────────────────────────────────────────────────
    @Size(max = 200) List<String> logs,
    @Size(max = 50) List<String> errorMessages,
    @Min(1) @Max(1440) Integer timeWindowMinutes,

    // ─── Risk ─────────────────────────────────────────────────────────────────
    List<String> domains,
    @Size(max = 10) List<String> assetIds) {}
