package com.portfolio.assetmanagement.application.testsupport.service;

import javax.sql.DataSource;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TestDataCleanupService {

  private final DataSource dataSource;

  public TestDataCleanupService(DataSource dataSource) {
    this.dataSource = dataSource;
  }

  @Transactional
  public void cleanupAndReseed() {
    runScript("test-support/cleanup-test-data.sql");
    runScript("test-support/seed-e2e-assets.sql");
  }

  private void runScript(String classpathLocation) {
    ResourceDatabasePopulator populator =
        new ResourceDatabasePopulator(
            false, false, "UTF-8", new ClassPathResource(classpathLocation));
    populator.execute(dataSource);
  }
}
