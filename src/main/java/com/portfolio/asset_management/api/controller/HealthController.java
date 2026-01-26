package com.portfolio.asset_management.api.controller;

import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController implements HealthIndicator {

    @Override
    public Health health() {
        return Health.up()
                .withDetail("application", "asset-management")
                .withDetail("status", "RUNNING")
                .build();
    }

    @GetMapping("/health")
    public Health healthEndpoint() {
        return health();
    }
}
