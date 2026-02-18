package com.portfolio.assetmanagement;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Classe principal da aplicação.
 *
 * <p>Responsável apenas por inicializar o Spring Boot. Nenhuma regra de negócio deve existir aqui.
 */
@SpringBootApplication
public class AssetManagementApplication {

  public static void main(String[] args) {
    SpringApplication.run(AssetManagementApplication.class, args);
  }
}