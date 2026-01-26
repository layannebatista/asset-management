package com.portfolio.asset_management.config;

import java.util.List;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.concurrent.ConcurrentMapCache;
import org.springframework.cache.support.SimpleCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableCaching
public class CacheConfig {

  @Bean
  public CacheManager cacheManager() {
    SimpleCacheManager cacheManager = new SimpleCacheManager();

    cacheManager.setCaches(
        List.of(
            new ConcurrentMapCache("assets"),
            new ConcurrentMapCache("users"),
            new ConcurrentMapCache("permissions"),
            new ConcurrentMapCache("abac-policies"),
            new ConcurrentMapCache("feature-flags")));

    return cacheManager;
  }
}
