package com.portfolio.asset_management.config;

import com.fasterxml.jackson.annotation.JsonInclude;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;

import com.fasterxml.jackson.databind.SerializationFeature;

import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configuração global do Jackson.
 *
 * Garante:
 *
 * - suporte correto a Instant, LocalDateTime, etc
 * - não serializar null
 * - não quebrar com campos desconhecidos
 * - formato consistente
 */
@Configuration
public class JacksonConfig {

    @Bean
    public ObjectMapper objectMapper() {

        ObjectMapper mapper = new ObjectMapper();

        /**
         * Suporte a java.time (Instant, LocalDateTime, etc)
         */
        mapper.registerModule(new JavaTimeModule());

        /**
         * Não serializar valores null
         */
        mapper.setSerializationInclusion(
            JsonInclude.Include.NON_NULL
        );

        /**
         * Não falhar com propriedades desconhecidas
         */
        mapper.configure(
            DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES,
            false
        );

        /**
         * Não escrever datas como timestamps numéricos
         */
        mapper.configure(
            SerializationFeature.WRITE_DATES_AS_TIMESTAMPS,
            false
        );

        /**
         * Evita erro com objetos vazios
         */
        mapper.configure(
            SerializationFeature.FAIL_ON_EMPTY_BEANS,
            false
        );

        return mapper;
    }

}
