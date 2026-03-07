package com.portfolio.assetmanagement.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;

/**
 * Habilita suporte a {@code @Async}.
 *
 * <p>Necessário para que {@code EmailService} e {@code WhatsAppService} enviem notificações sem
 * bloquear a thread da requisição HTTP.
 */
@Configuration
@EnableAsync
public class AsyncConfig {}
