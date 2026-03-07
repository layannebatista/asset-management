package com.portfolio.assetmanagement.interfaces.rest.export;

import com.portfolio.assetmanagement.application.asset.service.AssetService;
import com.portfolio.assetmanagement.application.audit.service.AuditQueryService;
import com.portfolio.assetmanagement.application.maintenance.service.MaintenanceService;
import com.portfolio.assetmanagement.shared.export.CsvExportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Endpoints de exportação CSV.
 *
 * <p>Usa streaming direto no response para suportar grandes volumes sem estouro de memória. Ideal
 * para testes de carga e relatórios automatizados.
 */
@Tag(name = "Export", description = "Exportação de dados em CSV para relatórios e auditoria")
@RestController
@RequestMapping("/export")
@PreAuthorize("hasAnyRole('ADMIN','GESTOR')")
public class ExportController {

  private final AssetService assetService;
  private final MaintenanceService maintenanceService;
  private final AuditQueryService auditQueryService;
  private final CsvExportService csvExportService;

  public ExportController(
      AssetService assetService,
      MaintenanceService maintenanceService,
      AuditQueryService auditQueryService,
      CsvExportService csvExportService) {
    this.assetService = assetService;
    this.maintenanceService = maintenanceService;
    this.auditQueryService = auditQueryService;
    this.csvExportService = csvExportService;
  }

  @Operation(
      summary = "Exportar ativos (CSV)",
      description =
          """
      Exporta todos os ativos da organização em formato CSV.
      Inclui: tag, tipo, modelo, status, unidade, responsável, nota fiscal, garantia.
      """)
  @GetMapping("/assets")
  public void exportAssets(HttpServletResponse response) throws IOException {
    String filename = "ativos_" + today() + ".csv";
    setCsvHeaders(response, filename);
    csvExportService.writeAssets(assetService.findAllForExport(), response.getWriter());
  }

  @Operation(
      summary = "Exportar manutenções (CSV)",
      description =
          """
      Exporta manutenções do período em CSV.
      Inclui: custo estimado vs real, status, resolução, datas.
      """)
  @GetMapping("/maintenance")
  public void exportMaintenance(
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
          LocalDate startDate,
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
          LocalDate endDate,
      HttpServletResponse response)
      throws IOException {
    String filename = "manutencoes_" + today() + ".csv";
    setCsvHeaders(response, filename);
    csvExportService.writeMaintenance(
        maintenanceService.findForExport(startDate, endDate), response.getWriter());
  }

  @Operation(
      summary = "Exportar auditoria (CSV)",
      description =
          """
      Exporta eventos de auditoria do período em CSV.
      Útil para compliance, SOX e auditorias externas.
      """)
  @GetMapping("/audit")
  @PreAuthorize("hasRole('ADMIN')")
  public void exportAudit(
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
          LocalDate startDate,
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
          LocalDate endDate,
      HttpServletResponse response)
      throws IOException {
    String filename = "auditoria_" + today() + ".csv";
    setCsvHeaders(response, filename);
    csvExportService.writeAudit(
        auditQueryService.findForExport(startDate, endDate), response.getWriter());
  }

  // ─────────────────────────────────────────────
  private void setCsvHeaders(HttpServletResponse response, String filename) {
    response.setContentType("text/csv; charset=UTF-8");
    response.setHeader("Content-Disposition", "attachment; filename=\"" + filename + "\"");
    response.setCharacterEncoding("UTF-8");
  }

  private String today() {
    return LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
  }
}
