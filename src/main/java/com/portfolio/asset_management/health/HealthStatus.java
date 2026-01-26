package com.portfolio.asset_management.health;

import java.time.LocalDateTime;

public class HealthStatus {

  private String service;
  private String status;
  private String message;
  private LocalDateTime timestamp;

  public HealthStatus(String service, String status, String message) {
    this.service = service;
    this.status = status;
    this.message = message;
    this.timestamp = LocalDateTime.now();
  }

  public String getService() {
    return service;
  }

  public String getStatus() {
    return status;
  }

  public String getMessage() {
    return message;
  }

  public LocalDateTime getTimestamp() {
    return timestamp;
  }
}
