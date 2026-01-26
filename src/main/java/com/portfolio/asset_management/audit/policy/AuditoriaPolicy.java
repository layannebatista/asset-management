package com.portfolio.asset_management.audit.policy;

import java.time.Duration;

public class AuditoriaPolicy {

  private boolean immutableEvents;
  private Duration retentionPeriod;
  private boolean anonymizePersonalData;

  public AuditoriaPolicy(
      boolean immutableEvents, Duration retentionPeriod, boolean anonymizePersonalData) {

    this.immutableEvents = immutableEvents;
    this.retentionPeriod = retentionPeriod;
    this.anonymizePersonalData = anonymizePersonalData;
  }

  public boolean isImmutableEvents() {
    return immutableEvents;
  }

  public Duration getRetentionPeriod() {
    return retentionPeriod;
  }

  public boolean isAnonymizePersonalData() {
    return anonymizePersonalData;
  }
}
