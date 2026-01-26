package com.portfolio.asset_management.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

@Configuration
public class IntegracaoConfig {

  @Bean
  public RestTemplate integrationRestTemplate() {
    SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
    factory.setConnectTimeout(5000);
    factory.setReadTimeout(10000);

    return new RestTemplate(factory);
  }

  @Bean
  public IntegrationRetryPolicy integrationRetryPolicy() {
    return new IntegrationRetryPolicy(3, 2000);
  }

  public static class IntegrationRetryPolicy {
    private final int maxAttempts;
    private final long backoffMillis;

    public IntegrationRetryPolicy(int maxAttempts, long backoffMillis) {
      this.maxAttempts = maxAttempts;
      this.backoffMillis = backoffMillis;
    }

    public int getMaxAttempts() {
      return maxAttempts;
    }

    public long getBackoffMillis() {
      return backoffMillis;
    }
  }
}
