package com.portfolio.assetmanagement.application.whatsapp.service;

import com.portfolio.assetmanagement.config.WhatsAppProperties;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

/**
 * Serviço de envio de mensagens WhatsApp via Meta Cloud API (v19.0).
 *
 * <p>Todos os métodos são assíncronos — falhas de entrega não revertem transações de negócio.
 *
 * <p><b>Pré-requisitos:</b>
 *
 * <ul>
 *   <li>Conta no Meta Business Manager com número de telefone verificado
 *   <li>Templates aprovados com status APPROVED para cada evento
 *   <li>Variáveis WHATSAPP_PHONE_NUMBER_ID e WHATSAPP_ACCESS_TOKEN configuradas
 * </ul>
 *
 * <p><b>Formato de número:</b> E.164 sem o '+' (ex: 5511999998888).
 */
@Service
public class WhatsAppService {

  private static final Logger log = LoggerFactory.getLogger(WhatsAppService.class);

  private final WhatsAppProperties props;
  private final RestTemplate restTemplate;

  public WhatsAppService(WhatsAppProperties props) {
    this.props = props;
    this.restTemplate = new RestTemplate();
  }

  // ════════════════════════════════════════════════════════
  //  AUTH / ATIVAÇÃO
  // ════════════════════════════════════════════════════════

  /**
   * Envia link de ativação de conta via WhatsApp.
   *
   * <p>Template esperado (2 variáveis):
   *
   * <pre>
   *   "Olá {{1}}! Clique no link para ativar sua conta no Patrimônio 360: {{2}}
   *    O link expira em 24 horas."
   * </pre>
   */
  @Async
  public void sendActivationLink(String phoneNumber, String userName, String activationLink) {
    String templateName = resolveTemplateName("activation");
    if (templateName == null) return;
    List<String> params = new ArrayList<>();
    params.add(userName);
    params.add(activationLink);
    sendTemplate(phoneNumber, templateName, params);
  }

  /**
   * Envia código MFA de 6 dígitos via WhatsApp.
   *
   * <p>Template esperado (1 variável):
   *
   * <pre>
   *   "Seu código de verificação do Patrimônio 360 é: *{{1}}*. Válido por 5 minutos.
   *    Nunca compartilhe este código."
   * </pre>
   */
  @Async
  public void sendMfaCode(String phoneNumber, String code) {
    String templateName = resolveTemplateName("mfa");
    if (templateName == null) return;
    List<String> params = new ArrayList<>();
    params.add(code);
    sendTemplate(phoneNumber, templateName, params);
  }

  // ════════════════════════════════════════════════════════
  //  USUÁRIOS
  // ════════════════════════════════════════════════════════

  /**
   * Notifica usuário sobre bloqueio de conta.
   *
   * <p>Template esperado (1 variável):
   *
   * <pre>
   *   "Olá {{1}}, sua conta no Patrimônio 360 foi bloqueada.
   *    Entre em contato com o administrador."
   * </pre>
   */
  @Async
  public void sendUserBlocked(String phoneNumber, String userName) {
    String templateName = resolveTemplateName("user-blocked");
    if (templateName == null) return;
    List<String> params = new ArrayList<>();
    params.add(userName);
    sendTemplate(phoneNumber, templateName, params);
  }

  // ════════════════════════════════════════════════════════
  //  ASSETS
  // ════════════════════════════════════════════════════════

  /**
   * Notifica usuário que um ativo foi atribuído a ele.
   *
   * <p>Template esperado (3 variáveis):
   *
   * <pre>
   *   "Olá {{1}}, o ativo *{{2}}* ({{3}}) foi atribuído a você no Patrimônio 360."
   * </pre>
   */
  @Async
  public void sendAssetAssigned(
      String phoneNumber, String userName, String assetTag, String assetModel) {
    String templateName = resolveTemplateName("asset-assigned");
    if (templateName == null) return;
    List<String> params = new ArrayList<>();
    params.add(userName);
    params.add(assetTag);
    params.add(assetModel);
    sendTemplate(phoneNumber, templateName, params);
  }

  /**
   * Notifica usuário que um ativo foi desatribuído dele.
   *
   * <p>Template esperado (3 variáveis):
   *
   * <pre>
   *   "Olá {{1}}, o ativo *{{2}}* ({{3}}) foi removido da sua responsabilidade."
   * </pre>
   */
  @Async
  public void sendAssetUnassigned(
      String phoneNumber, String userName, String assetTag, String assetModel) {
    String templateName = resolveTemplateName("asset-unassigned");
    if (templateName == null) return;
    List<String> params = new ArrayList<>();
    params.add(userName);
    params.add(assetTag);
    params.add(assetModel);
    sendTemplate(phoneNumber, templateName, params);
  }

  // ════════════════════════════════════════════════════════
  //  MANUTENÇÃO
  // ════════════════════════════════════════════════════════

  /**
   * Notifica responsável que uma manutenção foi solicitada para seu ativo.
   *
   * <p>Template esperado (4 variáveis):
   *
   * <pre>
   *   "Olá {{1}}, foi aberta uma solicitação de manutenção para o ativo
   *    *{{2}}* ({{3}}). ID da manutenção: #{{4}}."
   * </pre>
   */
  @Async
  public void sendMaintenanceRequested(
      String phoneNumber, String userName, String assetTag, String assetModel, Long maintenanceId) {
    String templateName = resolveTemplateName("maintenance-requested");
    if (templateName == null) return;
    List<String> params = new ArrayList<>();
    params.add(userName);
    params.add(assetTag);
    params.add(assetModel);
    params.add(String.valueOf(maintenanceId));
    sendTemplate(phoneNumber, templateName, params);
  }

  /**
   * Notifica responsável que a manutenção do seu ativo foi concluída.
   *
   * <p>Template esperado (4 variáveis):
   *
   * <pre>
   *   "Olá {{1}}, a manutenção #{{2}} do ativo *{{3}}* foi concluída.
   *    Resolução: {{4}}."
   * </pre>
   */
  @Async
  public void sendMaintenanceCompleted(
      String phoneNumber, String userName, Long maintenanceId, String assetTag, String resolution) {
    String templateName = resolveTemplateName("maintenance-completed");
    if (templateName == null) return;
    List<String> params = new ArrayList<>();
    params.add(userName);
    params.add(String.valueOf(maintenanceId));
    params.add(assetTag);
    params.add(resolution);
    sendTemplate(phoneNumber, templateName, params);
  }

  // ════════════════════════════════════════════════════════
  //  TRANSFERÊNCIAS
  // ════════════════════════════════════════════════════════

  /**
   * Notifica que uma transferência foi aprovada.
   *
   * <p>Template esperado (3 variáveis):
   *
   * <pre>
   *   "Olá {{1}}, a transferência #{{2}} do ativo *{{3}}* foi *aprovada*."
   * </pre>
   */
  @Async
  public void sendTransferApproved(
      String phoneNumber, String userName, Long transferId, String assetTag) {
    String templateName = resolveTemplateName("transfer-approved");
    if (templateName == null) return;
    List<String> params = new ArrayList<>();
    params.add(userName);
    params.add(String.valueOf(transferId));
    params.add(assetTag);
    sendTemplate(phoneNumber, templateName, params);
  }

  /**
   * Notifica que uma transferência foi rejeitada.
   *
   * <p>Template esperado (3 variáveis):
   *
   * <pre>
   *   "Olá {{1}}, a transferência #{{2}} do ativo *{{3}}* foi *rejeitada*."
   * </pre>
   */
  @Async
  public void sendTransferRejected(
      String phoneNumber, String userName, Long transferId, String assetTag) {
    String templateName = resolveTemplateName("transfer-rejected");
    if (templateName == null) return;
    List<String> params = new ArrayList<>();
    params.add(userName);
    params.add(String.valueOf(transferId));
    params.add(assetTag);
    sendTemplate(phoneNumber, templateName, params);
  }

  /**
   * Notifica que uma transferência foi concluída.
   *
   * <p>Template esperado (3 variáveis):
   *
   * <pre>
   *   "Olá {{1}}, a transferência #{{2}} do ativo *{{3}}* foi *concluída*
   *    e o ativo chegou ao destino."
   * </pre>
   */
  @Async
  public void sendTransferCompleted(
      String phoneNumber, String userName, Long transferId, String assetTag) {
    String templateName = resolveTemplateName("transfer-completed");
    if (templateName == null) return;
    List<String> params = new ArrayList<>();
    params.add(userName);
    params.add(String.valueOf(transferId));
    params.add(assetTag);
    sendTemplate(phoneNumber, templateName, params);
  }

  // ════════════════════════════════════════════════════════
  //  INVENTÁRIO
  // ════════════════════════════════════════════════════════

  /**
   * Notifica que uma sessão de inventário foi iniciada na unidade.
   *
   * <p>Template esperado (3 variáveis):
   *
   * <pre>
   *   "Olá {{1}}, uma sessão de inventário foi iniciada na unidade *{{2}}*.
   *    ID: #{{3}}."
   * </pre>
   */
  @Async
  public void sendInventoryStarted(
      String phoneNumber, String userName, String unitName, Long inventoryId) {
    String templateName = resolveTemplateName("inventory-started");
    if (templateName == null) return;
    List<String> params = new ArrayList<>();
    params.add(userName);
    params.add(unitName);
    params.add(String.valueOf(inventoryId));
    sendTemplate(phoneNumber, templateName, params);
  }

  /**
   * Notifica que uma sessão de inventário foi encerrada.
   *
   * <p>Template esperado (3 variáveis):
   *
   * <pre>
   *   "Olá {{1}}, o inventário #{{2}} da unidade *{{3}}* foi encerrado."
   * </pre>
   */
  @Async
  public void sendInventoryClosed(
      String phoneNumber, String userName, Long inventoryId, String unitName) {
    String templateName = resolveTemplateName("inventory-closed");
    if (templateName == null) return;
    List<String> params = new ArrayList<>();
    params.add(userName);
    params.add(String.valueOf(inventoryId));
    params.add(unitName);
    sendTemplate(phoneNumber, templateName, params);
  }

  private String resolveTemplateName(String key) {
    try {
      return props.template(key);
    } catch (IllegalStateException ex) {
      log.warn("WhatsApp desabilitado para '{}': {}", key, ex.getMessage());
      return null;
    }
  }

  // ════════════════════════════════════════════════════════
  //  CORE — Meta Cloud API
  // ════════════════════════════════════════════════════════

  /**
   * Envia uma mensagem de template via Meta Cloud API.
   *
   * <p>Monta o payload JSON conforme a especificação da API v19.0 e realiza a chamada HTTP. Erros
   * são logados mas nunca propagados.
   *
   * @param to número no formato E.164 sem '+' (ex: 5511999998888)
   * @param templateName nome do template aprovado no Meta Business Manager
   * @param parameters lista de valores das variáveis {{1}}, {{2}}, etc.
   */
  private void sendTemplate(String to, String templateName, List<String> parameters) {

    if (to == null || to.isBlank()) {
      log.warn("WhatsApp: número ausente — template '{}' não enviado.", templateName);
      return;
    }

    try {
      String url = props.getApiUrl() + "/" + props.getPhoneNumberId() + "/messages";

      // Monta lista de parâmetros do corpo
      List<Map<String, Object>> paramList = new ArrayList<>();
      for (String value : parameters) {
        Map<String, Object> param = new HashMap<>();
        param.put("type", "text");
        param.put("text", value);
        paramList.add(param);
      }

      // Componente body com os parâmetros
      Map<String, Object> bodyComponent = new HashMap<>();
      bodyComponent.put("type", "body");
      bodyComponent.put("parameters", paramList);

      List<Map<String, Object>> components = new ArrayList<>();
      components.add(bodyComponent);

      // Linguagem do template
      Map<String, Object> language = new HashMap<>();
      language.put("code", "pt_BR");

      // Template
      Map<String, Object> template = new HashMap<>();
      template.put("name", templateName);
      template.put("language", language);
      template.put("components", components);

      // Payload final
      Map<String, Object> payload = new HashMap<>();
      payload.put("messaging_product", "whatsapp");
      payload.put("to", sanitizePhone(to));
      payload.put("type", "template");
      payload.put("template", template);

      // Headers com Bearer token
      HttpHeaders headers = new HttpHeaders();
      headers.setContentType(MediaType.APPLICATION_JSON);
      headers.setBearerAuth(props.getAccessToken());

      HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);
      restTemplate.postForObject(url, request, String.class);

      log.info("WhatsApp enviado: template='{}' to='{}'", templateName, maskPhone(to));

    } catch (Exception e) {
      log.error(
          "Falha ao enviar WhatsApp: template='{}' to='{}': {}",
          templateName,
          maskPhone(to),
          e.getMessage(),
          e);
    }
  }

  /** Remove caracteres não numéricos e valida formato mínimo E.164. */
  private String sanitizePhone(String phone) {
    String digits = phone.replaceAll("\\D", "");
    if (digits.length() < 10 || digits.length() > 15) {
      throw new IllegalArgumentException("Número de telefone inválido: " + phone);
    }
    return digits;
  }

  /** Máscara para log: exibe apenas os últimos 4 dígitos. */
  private String maskPhone(String phone) {
    String digits = phone.replaceAll("\\D", "");
    if (digits.length() < 4) return "****";
    return "*".repeat(digits.length() - 4) + digits.substring(digits.length() - 4);
  }
}
