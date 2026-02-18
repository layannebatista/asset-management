package com.portfolio.assetmanagement.shared.util;

import com.portfolio.assetmanagement.shared.exception.ValidationException;
import java.time.LocalDateTime;

public final class DateUtil {

  private DateUtil() {}

  public static void validateNotNull(LocalDateTime date, String fieldName) {
    if (date == null) {
      throw new ValidationException(fieldName + " must not be null");
    }
  }

  public static void validateNotFuture(LocalDateTime date, String fieldName) {
    validateNotNull(date, fieldName);

    if (date.isAfter(LocalDateTime.now())) {
      throw new ValidationException(fieldName + " cannot be in the future");
    }
  }

  public static void validateNotPast(LocalDateTime date, String fieldName) {
    validateNotNull(date, fieldName);

    if (date.isBefore(LocalDateTime.now())) {
      throw new ValidationException(fieldName + " cannot be in the past");
    }
  }

  public static void validateStartBeforeEnd(
      LocalDateTime startDate, LocalDateTime endDate, String startFieldName, String endFieldName) {

    validateNotNull(startDate, startFieldName);
    validateNotNull(endDate, endFieldName);

    if (endDate.isBefore(startDate)) {
      throw new ValidationException(endFieldName + " cannot be before " + startFieldName);
    }
  }
}
