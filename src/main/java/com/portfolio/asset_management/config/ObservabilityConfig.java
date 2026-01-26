package com.portfolio.asset_management.config;

import org.slf4j.MDC;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Bean;

import java.util.UUID;
import java.util.function.Supplier;

@Configuration
public class ObservabilityConfig {

    /**
     * Gera correlationId para rastreamento distribuído
     */
    @Bean
    public Supplier<String> correlationIdSupplier() {
        return () -> {
            String correlationId = UUID.randomUUID().toString();
            MDC.put("correlationId", correlationId);
            return correlationId;
        };
    }

    /**
     * Limpa contexto ao final da requisição
     */
    @Bean
    public Runnable mdcCleaner() {
        return MDC::clear;
    }
}
