package com.portfolio.assetmanagement.interfaces.rest.audit.controller;

import com.portfolio.assetmanagement.application.audit.service.AuditQueryService;
import com.portfolio.assetmanagement.domain.audit.entity.AuditEvent;
import com.portfolio.assetmanagement.domain.audit.enums.AuditEventType;
import com.portfolio.assetmanagement.shared.exception.NotFoundException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.*;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.time.OffsetDateTime;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Audit", description = "Consulta de eventos de auditoria com isolamento multi-tenant")
@RestController
@RequestMapping("/audit")
public class AuditController {

  private final AuditQueryService queryService;

  public AuditController(AuditQueryService queryService) {
    this.queryService = queryService;
  }

  /* ============================================================
   *  LISTAR EVENTOS DA ORGANIZAÇÃO ATUAL
   * ============================================================ */

  @Operation(
      summary = "Listar eventos da organização atual",
      description =
          """
          Retorna todos os eventos de auditoria associados à organização
          do usuário autenticado (multi-tenant safe).

          Restrito a ADMIN e MANAGER.
          """)
  @ApiResponses({
    @ApiResponse(responseCode = "200", description = "Eventos retornados com sucesso"),
    @ApiResponse(responseCode = "401", description = "Usuário não autenticado"),
    @ApiResponse(responseCode = "403", description = "Sem permissão")
  })
  @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
  @GetMapping
  public List<AuditEvent> listOrganizationEvents() {
    return queryService.findCurrentOrganizationEvents();
  }

  /* ============================================================
   *  LISTAR POR USUÁRIO
   * ============================================================ */

  @Operation(
      summary = "Listar eventos por usuário",
      description = "Retorna eventos de auditoria relacionados a um usuário específico.")
  @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
  @GetMapping("/user/{userId}")
  public List<AuditEvent> listByUser(
      @Parameter(description = "ID do usuário", example = "10") @PathVariable Long userId) {

    return queryService.findByUser(userId);
  }

  /* ============================================================
   *  LISTAR POR TIPO
   * ============================================================ */

  @Operation(
      summary = "Listar eventos por tipo",
      description =
          """
          Filtra eventos de auditoria por tipo.

          Exemplos de tipo:
          - ASSET_CREATED
          - ASSET_ASSIGNED
          - ASSET_RETIRED
          - USER_CREATED
          """)
  @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
  @GetMapping("/type/{type}")
  public List<AuditEvent> listByType(
      @Parameter(description = "Tipo do evento", example = "ASSET_CREATED") @PathVariable
          AuditEventType type) {

    return queryService.findByType(type);
  }

  /* ============================================================
   *  LISTAR POR TARGET
   * ============================================================ */

  @Operation(
      summary = "Listar eventos por entidade alvo (target)",
      description =
          """
          Filtra eventos de auditoria por entidade específica.

          Exemplo:
          - targetType = ASSET
          - targetId = 5
          """)
  @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
  @GetMapping("/target")
  public List<AuditEvent> listByTarget(
      @Parameter(description = "Tipo da entidade auditada", example = "ASSET") @RequestParam
          String targetType,
      @Parameter(description = "ID da entidade auditada", example = "5") @RequestParam
          Long targetId) {

    return queryService.findByTarget(targetType, targetId);
  }

  /* ============================================================
   *  LISTAR POR PERÍODO
   * ============================================================ */

  @Operation(
      summary = "Listar eventos por período",
      description =
          """
          Retorna eventos de auditoria dentro de um intervalo de datas.

          Datas devem ser enviadas no formato ISO-8601:
          2026-01-01T00:00:00Z
          """)
  @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
  @GetMapping("/period")
  public List<AuditEvent> listByPeriod(
      @Parameter(description = "ID da organização", example = "1") @RequestParam
          Long organizationId,
      @Parameter(description = "Data inicial (ISO-8601)", example = "2026-01-01T00:00:00Z")
          @RequestParam
          @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
          OffsetDateTime start,
      @Parameter(description = "Data final (ISO-8601)", example = "2026-12-31T23:59:59Z")
          @RequestParam
          @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
          OffsetDateTime end) {

    return queryService.findByPeriod(organizationId, start, end);
  }

  /* ============================================================
   *  ÚLTIMO EVENTO DO TARGET
   * ============================================================ */

  @Operation(
      summary = "Buscar último evento de uma entidade",
      description =
          """
          Retorna o evento mais recente relacionado a uma entidade específica.

          Caso não exista evento, retorna 404.
          """)
  @ApiResponses({
    @ApiResponse(responseCode = "200", description = "Evento encontrado"),
    @ApiResponse(responseCode = "404", description = "Nenhum evento encontrado")
  })
  @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
  @GetMapping("/target/last")
  public AuditEvent lastEvent(
      @Parameter(description = "Tipo da entidade", example = "ASSET") @RequestParam
          String targetType,
      @Parameter(description = "ID da entidade", example = "5") @RequestParam Long targetId) {

    AuditEvent event = queryService.findLastEvent(targetType, targetId);

    if (event == null) {
      throw new NotFoundException("Nenhum evento encontrado");
    }

    return event;
  }
}
