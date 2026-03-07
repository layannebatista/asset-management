package com.portfolio.assetmanagement.config;

import java.util.Map;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Binding tipado das propriedades {@code app.whatsapp.*} do application.yml.
 *
 * <p>Centraliza acesso às credenciais da Meta Cloud API e aos nomes dos templates aprovados no Meta
 * Business Manager.
 */
@Component
@ConfigurationProperties(prefix = "app.whatsapp")
public class WhatsAppProperties {

  private String phoneNumberId;
  private String accessToken;
  private String apiUrl;
  private Map<String, String> templates;

  public String getPhoneNumberId() {
    return phoneNumberId;
  }

  public void setPhoneNumberId(String phoneNumberId) {
    this.phoneNumberId = phoneNumberId;
  }

  public String getAccessToken() {
    return accessToken;
  }

  public void setAccessToken(String accessToken) {
    this.accessToken = accessToken;
  }

  public String getApiUrl() {
    return apiUrl;
  }

  public void setApiUrl(String apiUrl) {
    this.apiUrl = apiUrl;
  }

  public Map<String, String> getTemplates() {
    return templates;
  }

  public void setTemplates(Map<String, String> templates) {
    this.templates = templates;
  }

  /** Retorna o nome do template pelo chave do yml (ex: "activation", "mfa"). */
  public String template(String key) {
    if (templates == null || !templates.containsKey(key)) {
      throw new IllegalStateException(
          "Template WhatsApp não configurado: app.whatsapp.templates." + key);
    }
    return templates.get(key);
  }
}
