package com.portfolio.asset_management.shared.response;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.Instant;

/**
 * Estrutura padrão de resposta da API.
 *
 * Garante consistência entre todas as respostas REST.
 *
 * Formato de sucesso:
 *
 * {
 *   "success": true,
 *   "data": {...},
 *   "timestamp": 1710000000000
 * }
 *
 * Formato de erro:
 *
 * {
 *   "success": false,
 *   "error": {...},
 *   "timestamp": 1710000000000
 * }
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

    private boolean success;

    private T data;

    private ErrorResponse error;

    private long timestamp;

    /**
     * Construtor privado.
     */
    private ApiResponse() {

        this.timestamp = Instant.now().toEpochMilli();
    }

    /**
     * Cria resposta de sucesso com dados.
     */
    public static <T> ApiResponse<T> success(T data) {

        ApiResponse<T> response = new ApiResponse<>();

        response.success = true;

        response.data = data;

        return response;
    }

    /**
     * Cria resposta de sucesso sem dados.
     */
    public static <T> ApiResponse<T> success() {

        ApiResponse<T> response = new ApiResponse<>();

        response.success = true;

        return response;
    }

    /**
     * Cria resposta de erro.
     */
    public static <T> ApiResponse<T> error(ErrorResponse error) {

        ApiResponse<T> response = new ApiResponse<>();

        response.success = false;

        response.error = error;

        return response;
    }

    public boolean isSuccess() {

        return success;
    }

    public T getData() {

        return data;
    }

    public ErrorResponse getError() {

        return error;
    }

    public long getTimestamp() {

        return timestamp;
    }

}
