package com.portfolio.asset_management.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.task.TaskExecutor;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

@Configuration
@EnableAsync
public class MessageConfig {

  /**
   * Executor padrão para: - envio de notificações (email / whatsapp) - publicação de eventos de
   * auditoria - retries assíncronos - processamento desacoplado
   */
  @Bean(name = "messageTaskExecutor")
  public TaskExecutor messageTaskExecutor() {
    ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
    executor.setCorePoolSize(5);
    executor.setMaxPoolSize(20);
    executor.setQueueCapacity(500);
    executor.setThreadNamePrefix("message-exec-");
    executor.initialize();
    return executor;
  }
}
