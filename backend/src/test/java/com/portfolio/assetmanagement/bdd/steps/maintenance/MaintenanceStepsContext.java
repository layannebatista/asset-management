package com.portfolio.assetmanagement.bdd.steps.maintenance;

/**
 * Context compartilhado entre os diferentes Steps de Maintenance.
 * Mantém o estado (ativos, ID da manutenção) necessário ao longo do cenário.
 */
public class MaintenanceStepsContext {

  private Long organizacaoId;
  private Long unidadeId;
  private String ativoTagAtual;
  private Long manutencaoId;

  public Long getOrganizacaoId() {
    return organizacaoId;
  }

  public void setOrganizacaoId(Long id) {
    this.organizacaoId = id;
  }

  public Long getUnidadeId() {
    return unidadeId;
  }

  public void setUnidadeId(Long id) {
    this.unidadeId = id;
  }

  public String getAtivoTagAtual() {
    return ativoTagAtual;
  }

  public void setAtivoTagAtual(String tag) {
    this.ativoTagAtual = tag;
  }

  public Long getManutencaoId() {
    return manutencaoId;
  }

  public void setManutencaoId(Long id) {
    this.manutencaoId = id;
  }
}
