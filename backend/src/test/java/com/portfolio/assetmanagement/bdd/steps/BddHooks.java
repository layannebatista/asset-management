package com.portfolio.assetmanagement.bdd.steps;

import com.portfolio.assetmanagement.bdd.support.BddDatabaseCleaner;
import com.portfolio.assetmanagement.config.ratelimit.RateLimitFilter;
import io.cucumber.java.Before;

public class BddHooks {

  private final BddDatabaseCleaner databaseCleaner;
  private final RateLimitFilter rateLimitFilter;

  public BddHooks(BddDatabaseCleaner databaseCleaner, RateLimitFilter rateLimitFilter) {
    this.databaseCleaner = databaseCleaner;
    this.rateLimitFilter = rateLimitFilter;
  }

  @Before(order = 0)
  public void resetDatabaseBeforeScenario() {
    rateLimitFilter.clearAllBucketsForTests();
    databaseCleaner.resetScenarioData();
  }
}
