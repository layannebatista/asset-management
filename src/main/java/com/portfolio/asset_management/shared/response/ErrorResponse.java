package com.portfolio.asset_management.shared.response;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.Instant;
import java.util.List;

/**
 * Estrutura padrão de erro da API.
 *
 * Exemplo:
 *
 * {
 *   "code": "RESOURCE_NOT_FOUND",
 *   "message": "Asset não encontrado",
 *   "details": ["assetId=123"],
 *   "timestamp": 1710000000000
 * }
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ErrorResponse {

    private String code;

    private String message;

    private List<String> details;

    private long timestamp;

    /**
     * Construtor principal.
     */
    public ErrorResponse(String code, String message) {

        this.code = code;
        this.message = message;
        this.timestamp = Instant.now().toEpochMilli();
    }

    /**
     * Construtor com detalhes adicionais.
     */
    public ErrorResponse(
        String code,
        String message,
        List<String> details
    ) {

        this.code = code;
        this.message = message;
        this.details = details;
        this.timestamp = Instant.now().toEpochMilli();
    }

    public String getCode() {

        return code;
    }

    public String getMessage() {

        return message;
    }

    public List<String> getDetails() {

        return details;
    }

    public long getTimestamp() {

        return timestamp;
    }

}
