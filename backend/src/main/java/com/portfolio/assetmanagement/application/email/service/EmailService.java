package com.portfolio.assetmanagement.application.email.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * Serviço responsável pelo envio de e-mails transacionais do sistema.
 *
 * <p>Todos os envios são assíncronos para não bloquear o fluxo principal da requisição.
 */
@Service
public class EmailService {

  private static final Logger log = LoggerFactory.getLogger(EmailService.class);

  private final JavaMailSender mailSender;

  @Value("${app.mail.from}")
  private String fromAddress;

  @Value("${app.mail.from-name}")
  private String fromName;

  @Value("${app.frontend.url}")
  private String frontendUrl;

  public EmailService(JavaMailSender mailSender) {
    this.mailSender = mailSender;
  }

  /**
   * Envia o e-mail de ativação de conta com o link de primeiro acesso.
   *
   * <p>O link expira em 24 horas conforme configurado em {@code TOKEN_EXPIRATION_SECONDS} no {@link
   * com.portfolio.assetmanagement.application.user.service.UserActivationService}.
   *
   * @param toEmail endereço de destino
   * @param userName nome do usuário para personalizar o e-mail
   * @param token UUID do token de ativação gerado
   */
  @Async
  public void sendActivationEmail(String toEmail, String userName, String token) {

    String activationLink = frontendUrl + "/activate?token=" + token;

    String subject = "Patrimônio 360 — Ative sua conta";

    String body = buildActivationEmailBody(userName, activationLink);

    send(toEmail, subject, body);
  }

  private void send(String to, String subject, String htmlBody) {

    try {

      MimeMessage message = mailSender.createMimeMessage();

      MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

      helper.setFrom(fromAddress, fromName);
      helper.setTo(to);
      helper.setSubject(subject);
      helper.setText(htmlBody, true);

      mailSender.send(message);

      log.info("E-mail enviado com sucesso para: {}", to);

    } catch (MessagingException | java.io.UnsupportedEncodingException | MailException e) {

      log.error("Falha ao enviar e-mail para {}: {}", to, e.getMessage(), e);

    } catch (RuntimeException e) {

      log.error("Falha ao enviar e-mail para {}: {}", to, e.getMessage(), e);
    }
  }

  private String buildActivationEmailBody(String userName, String activationLink) {

    return """
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Ative sua conta</title>
        </head>
        <body style="margin:0;padding:0;background-color:#f8fafc;font-family:Inter,Arial,sans-serif;">

          <table width="100%%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;padding:40px 0;">
            <tr>
              <td align="center">
                <table width="560" cellpadding="0" cellspacing="0"
                       style="background-color:#ffffff;border-radius:8px;border:1px solid #e2e8f0;overflow:hidden;">

                  <tr>
                    <td style="background-color:#1e293b;padding:28px 40px;">
                      <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:600;letter-spacing:-0.3px;">
                        Patrimônio 360
                      </h1>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:40px;">

                      <p style="margin:0 0 8px;color:#64748b;font-size:14px;">Olá,</p>
                      <h2 style="margin:0 0 24px;color:#1e293b;font-size:22px;font-weight:600;">
                        Bem-vindo(a), %s!
                      </h2>

                      <p style="margin:0 0 16px;color:#475569;font-size:15px;line-height:1.6;">
                        Sua conta foi criada no sistema de gestão de ativos
                        <strong>Patrimônio 360</strong>. Para ativá-la e definir sua senha,
                        clique no botão abaixo.
                      </p>

                      <p style="margin:0 0 32px;color:#94a3b8;font-size:13px;">
                        Este link é válido por <strong>24 horas</strong>.
                      </p>

                      <table cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
                        <tr>
                          <td style="background-color:#3b51d9;border-radius:6px;">
                            <a href="%s"
                               style="display:inline-block;padding:14px 32px;color:#ffffff;
                                      font-size:15px;font-weight:600;text-decoration:none;
                                      letter-spacing:-0.2px;">
                              Ativar minha conta
                            </a>
                          </td>
                        </tr>
                      </table>

                      <table cellpadding="0" cellspacing="0" width="100%%"
                             style="background-color:#f1f5f9;border-radius:6px;margin-bottom:32px;">
                        <tr>
                          <td style="padding:16px 20px;">
                            <p style="margin:0 0 8px;color:#1e293b;font-size:13px;font-weight:600;">
                              Requisitos da senha
                            </p>
                            <ul style="margin:0;padding-left:18px;color:#475569;font-size:13px;line-height:1.8;">
                              <li>Mínimo de 8 caracteres</li>
                              <li>Pelo menos uma letra maiúscula</li>
                              <li>Pelo menos uma letra minúscula</li>
                              <li>Pelo menos um número</li>
                              <li>Pelo menos um símbolo (ex: @, #, $, !)</li>
                            </ul>
                          </td>
                        </tr>
                      </table>

                      <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6;">
                        Se o botão não funcionar, copie e cole o link abaixo no seu navegador:<br/>
                        <a href="%s" style="color:#3b51d9;word-break:break-all;">%s</a>
                      </p>

                    </td>
                  </tr>

                  <tr>
                    <td style="background-color:#f8fafc;border-top:1px solid #e2e8f0;
                                padding:20px 40px;">
                      <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6;">
                        Você está recebendo este e-mail porque um administrador criou uma conta
                        para você no Patrimônio 360. Se não reconhece esta ação, ignore este
                        e-mail — nenhuma conta será ativada sem que você clique no link.
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>

        </body>
        </html>
        """
        .formatted(userName, activationLink, activationLink, activationLink);
  }
}
