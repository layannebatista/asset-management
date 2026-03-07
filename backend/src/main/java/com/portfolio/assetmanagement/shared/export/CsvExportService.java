package com.portfolio.assetmanagement.shared.export;

import com.portfolio.assetmanagement.domain.asset.entity.Asset;
import com.portfolio.assetmanagement.domain.audit.entity.AuditEvent;
import com.portfolio.assetmanagement.domain.maintenance.entity.MaintenanceRecord;
import java.io.PrintWriter;
import java.time.format.DateTimeFormatter;
import java.util.List;
import org.springframework.stereotype.Service;

/**
 * Exportação de dados para CSV.
 *
 * <p>Escreve diretamente no {@code PrintWriter} do {@code HttpServletResponse} para evitar carregar
 * o CSV inteiro em memória (streaming).
 *
 * <p>Endpoints que usam este serviço devem setar:
 *
 * <pre>
 *   response.setContentType("text/csv; charset=UTF-8");
 *   response.setHeader("Content-Disposition", "attachment; filename=export.csv");
 * </pre>
 */
@Service
public class CsvExportService {

  private static final DateTimeFormatter DT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
  private static final String COMMA = ",";
  private static final String NL = "\n";

  // ─────────────────────────────────────────────
  //  Assets
  // ─────────────────────────────────────────────

  public void writeAssets(List<Asset> assets, PrintWriter writer) {
    writer.print(
        "id,assetTag,type,model,status,unitId,assignedUserId,"
            + "purchaseDate,invoiceNumber,supplier,warrantyExpiry\n");
    for (Asset a : assets) {
      writer.print(safe(a.getId()) + COMMA);
      writer.print(safe(a.getAssetTag()) + COMMA);
      writer.print(safe(a.getType()) + COMMA);
      writer.print(safe(a.getModel()) + COMMA);
      writer.print(safe(a.getStatus()) + COMMA);
      writer.print(safe(a.getUnit().getId()) + COMMA);
      writer.print(safe(a.getAssignedUser() != null ? a.getAssignedUser().getId() : null) + COMMA);
      writer.print(safe(a.getPurchaseDate()) + COMMA);
      writer.print(safe(a.getInvoiceNumber()) + COMMA);
      writer.print(safe(a.getSupplier()) + COMMA);
      writer.print(safe(a.getWarrantyExpiry()) + NL);
    }
    writer.flush();
  }

  // ─────────────────────────────────────────────
  //  Maintenance
  // ─────────────────────────────────────────────

  public void writeMaintenance(List<MaintenanceRecord> records, PrintWriter writer) {
    writer.print(
        "id,assetId,status,description,resolution,"
            + "estimatedCost,actualCost,createdAt,completedAt\n");
    for (MaintenanceRecord r : records) {
      writer.print(safe(r.getId()) + COMMA);
      writer.print(safe(r.getAsset().getId()) + COMMA);
      writer.print(safe(r.getStatus()) + COMMA);
      writer.print(csvEscape(r.getDescription()) + COMMA);
      writer.print(csvEscape(r.getResolution()) + COMMA);
      writer.print(safe(r.getEstimatedCost()) + COMMA);
      writer.print(safe(r.getActualCost()) + COMMA);
      writer.print(safe(r.getCreatedAt() != null ? r.getCreatedAt().format(DT) : null) + COMMA);
      writer.print(safe(r.getCompletedAt() != null ? r.getCompletedAt().format(DT) : null) + NL);
    }
    writer.flush();
  }

  // ─────────────────────────────────────────────
  //  Audit
  // ─────────────────────────────────────────────

  public void writeAudit(List<AuditEvent> events, PrintWriter writer) {
    writer.print(
        "id,eventType,targetType,targetId,actorUserId,organizationId,unitId,details,createdAt\n");
    for (AuditEvent e : events) {
      writer.print(safe(e.getId()) + COMMA);
      writer.print(safe(e.getType()) + COMMA);
      writer.print(safe(e.getTargetType()) + COMMA);
      writer.print(safe(e.getTargetId()) + COMMA);
      writer.print(safe(e.getActorUserId()) + COMMA);
      writer.print(safe(e.getOrganizationId()) + COMMA);
      writer.print(safe(e.getUnitId()) + COMMA);
      writer.print(csvEscape(e.getDetails()) + COMMA);
      writer.print(safe(e.getCreatedAt() != null ? e.getCreatedAt().format(DT) : null) + NL);
    }
    writer.flush();
  }

  // ─────────────────────────────────────────────
  //  Helpers
  // ─────────────────────────────────────────────

  private String safe(Object val) {
    return val != null ? val.toString() : "";
  }

  /** Escapa campos que podem ter vírgula ou aspas (RFC 4180). */
  private String csvEscape(String val) {
    if (val == null) return "";
    String escaped = val.replace("\"", "\"\"");
    if (escaped.contains(",") || escaped.contains("\"") || escaped.contains("\n")) {
      return "\"" + escaped + "\"";
    }
    return escaped;
  }
}
