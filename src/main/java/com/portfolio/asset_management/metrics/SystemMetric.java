package com.portfolio.asset_management.metrics;

import java.time.LocalDateTime;

public class SystemMetric {

  private String name;
  private double value;
  private String unit;
  private LocalDateTime collectedAt;

  public SystemMetric(String name, double value, String unit) {
    this.name = name;
    this.value = value;
    this.unit = unit;
    this.collectedAt = LocalDateTime.now();
  }

  public String getName() {
    return name;
  }

  public double getValue() {
    return value;
  }

  public String getUnit() {
    return unit;
  }

  public LocalDateTime getCollectedAt() {
    return collectedAt;
  }
}
