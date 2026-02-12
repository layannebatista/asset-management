package com.portfolio.asset_management.shared.exception;

import com.portfolio.asset_management.shared.constants.ErrorCodes;

import java.util.List;

/**
 * Exceção usada quando um recurso não é encontrado.
 *
 * Exemplos:
 * - Asset não encontrado
 * - Usuário não encontrado
 * - Organização não encontrada
 * - Unidade não encontrada
 */
public class ResourceNotFoundException extends RuntimeException {

    private final String errorCode;

    private final List<String> details;

    /**
     * Construtor padrão com mensagem.
     */
    public ResourceNotFoundException(String message) {

        super(message);

        this.errorCode = ErrorCodes.RESOURCE_NOT_FOUND;

        this.details = null;
    }

    /**
     * Construtor com código personalizado.
     */
    public ResourceNotFoundException(String errorCode, String message) {

        super(message);

        this.errorCode = errorCode;

        this.details = null;
    }

    /**
     * Construtor com código e detalhes adicionais.
     */
    public ResourceNotFoundException(
        String errorCode,
        String message,
        List<String> details
    ) {

        super(message);

        this.errorCode = errorCode;

        this.details = details;
    }

    /**
     * Retorna código do erro.
     */
    public String getErrorCode() {

        return errorCode;
    }

    /**
     * Retorna detalhes adicionais.
     */
    public List<String> getDetails() {

        return details;
    }

}
