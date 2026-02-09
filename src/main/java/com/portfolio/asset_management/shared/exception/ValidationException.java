package com.portfolio.asset_management.shared.exception;

import java.util.List;

import com.portfolio.asset_management.shared.dto.FieldErrorDTO;

public class ValidationException extends RuntimeException {

    private final List<FieldErrorDTO> fieldErrors;

    public ValidationException(String message) {
        super(message);
        this.fieldErrors = null;
    }

    public ValidationException(String message, List<FieldErrorDTO> fieldErrors) {
        super(message);
        this.fieldErrors = fieldErrors;
    }

    public ValidationException(String message, Throwable cause) {
        super(message, cause);
        this.fieldErrors = null;
    }

    public List<FieldErrorDTO> getFieldErrors() {
        return fieldErrors;
    }
}
