package com.portfolio.assetmanagement.application.insurance.service;

import com.portfolio.assetmanagement.application.insurance.dto.InsuranceCreateDTO;
import com.portfolio.assetmanagement.application.insurance.dto.InsuranceSummaryDTO;
import com.portfolio.assetmanagement.application.whatsapp.service.WhatsAppService;
import com.portfolio.assetmanagement.domain.insurance.entity.AssetInsurance;
import com.portfolio.assetmanagement.infrastructure.persistence.asset.repository.AssetRepository;
import com.portfolio.assetmanagement.infrastructure.persistence.insurance.repository.InsuranceRepository;
import com.portfolio.assetmanagement.infrastructure.persistence.user.repository.UserRepository;
import com.portfolio.assetmanagement.security.context.LoggedUserContext;
import com.portfolio.assetmanagement.shared.exception.NotFoundException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InsuranceService {

  private final InsuranceRepository insuranceRepository;
  private final AssetRepository assetRepository;
  private final UserRepository userRepository;
  private final WhatsAppService whatsAppService;
  private final LoggedUserContext loggedUser;

  public InsuranceService(
      InsuranceRepository insuranceRepository,
      AssetRepository assetRepository,
      UserRepository userRepository,
      WhatsAppService whatsAppService,
      LoggedUserContext loggedUser) {
    this.insuranceRepository = insuranceRepository;
    this.assetRepository = assetRepository;
    this.userRepository = userRepository;
    this.whatsAppService = whatsAppService;
    this.loggedUser = loggedUser;
  }

  /** Registra nova apólice de seguro para um ativo. */
  @Transactional
  public AssetInsurance register(Long assetId, InsuranceCreateDTO dto) {
    assetRepository
        .findById(assetId)
        .orElseThrow(() -> new NotFoundException("Ativo não encontrado"));

    // Desativa apólice anterior se houver
    insuranceRepository
        .findByAssetIdAndActiveTrue(assetId)
        .ifPresent(
            old -> {
              old.deactivate();
              insuranceRepository.save(old);
            });

    AssetInsurance insurance =
        new AssetInsurance(
            assetId,
            loggedUser.getOrganizationId(),
            dto.getPolicyNumber(),
            dto.getInsurer(),
            dto.getCoverageValue(),
            dto.getPremium(),
            dto.getStartDate(),
            dto.getExpiryDate());

    return insuranceRepository.save(insurance);
  }

  /** Apólice ativa de um ativo. */
  @Transactional(readOnly = true)
  public AssetInsurance getActive(Long assetId) {
    return insuranceRepository
        .findByAssetIdAndActiveTrue(assetId)
        .orElseThrow(() -> new NotFoundException("Nenhuma apólice ativa para este ativo"));
  }

  /** Lista apólices vencendo nos próximos N dias. */
  @Transactional(readOnly = true)
  public List<AssetInsurance> getExpiringSoon(int days) {
    return insuranceRepository.findExpiringSoon(
        loggedUser.getOrganizationId(), LocalDate.now(), LocalDate.now().plusDays(days));
  }

  /** Resumo financeiro de seguros da organização. */
  @Transactional(readOnly = true)
  public InsuranceSummaryDTO getSummary() {
    Long orgId = loggedUser.getOrganizationId();
    List<AssetInsurance> expiringSoon =
        insuranceRepository.findExpiringSoon(orgId, LocalDate.now(), LocalDate.now().plusDays(30));

    // Pode ser expandido com queries agregadas no repositório
    InsuranceSummaryDTO dto = new InsuranceSummaryDTO();
    dto.setExpiringIn30Days((long) expiringSoon.size());
    dto.setTotalCoverageExpiring(
        expiringSoon.stream()
            .map(AssetInsurance::getCoverageValue)
            .reduce(BigDecimal.ZERO, BigDecimal::add));
    return dto;
  }

  /**
   * Scheduler: envia alertas WhatsApp de apólices vencendo em 30 dias. Executado diariamente às
   * 08h00.
   */
  @Scheduled(cron = "0 0 8 * * *")
  @Transactional(readOnly = true)
  public void sendExpiryAlerts() {
    List<AssetInsurance> expiring =
        insuranceRepository.findExpiringSoon(
            loggedUser.getOrganizationId(), LocalDate.now(), LocalDate.now().plusDays(30));

    for (AssetInsurance ins : expiring) {
      assetRepository
          .findById(ins.getAssetId())
          .ifPresent(
              asset -> {
                Long userId =
                    asset.getAssignedUser() != null ? asset.getAssignedUser().getId() : null;

                if (userId != null) {
                  userRepository
                      .findById(userId)
                      .ifPresent(
                          user -> {
                            if (user.getPhoneNumber() != null) {
                              // Reutiliza template de manutenção como proxy — em produção
                              // criar template específico: patrimonio_insurance_expiry
                              whatsAppService.sendMaintenanceRequested(
                                  user.getPhoneNumber(),
                                  user.getName(),
                                  asset.getAssetTag(),
                                  "Apólice "
                                      + ins.getPolicyNumber()
                                      + " vence em "
                                      + ins.getExpiryDate(),
                                  ins.getId());
                            }
                          });
                }
              });
    }
  }
}
