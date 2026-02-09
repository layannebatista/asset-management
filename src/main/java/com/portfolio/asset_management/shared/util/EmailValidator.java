package com.portfolio.asset_management.shared.util;

import java.util.regex.Pattern;

import com.portfolio.asset_management.shared.exception.ValidationException;

public final class EmailValidator {

    private EmailValidator() {}

    private static final Pattern EMAIL_PATTERN =
        Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$");

    public static void validate(String email) {

        if (email == null) {
            throw new ValidationException("Email must not be null");
        }

        String normalized = email.trim();

        if (normalized.isEmpty()) {
            throw new ValidationException("Email must not be empty");
        }

        if (!EMAIL_PATTERN.matcher(normalized).matches()) {
            throw new ValidationException("Email format is invalid");
        }

    }

    public static String normalize(String email) {

        validate(email);

        return email.trim().toLowerCase();
    }

}
