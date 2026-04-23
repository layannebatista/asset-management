package com.portfolio.assetmanagement.interfaces.rest.transfer.controller;

import com.portfolio.assetmanagement.application.transfer.dto.TransferApproveDTO;
import com.portfolio.assetmanagement.application.transfer.dto.TransferCreateDTO;
import com.portfolio.assetmanagement.application.transfer.dto.TransferResponseDTO;
import com.portfolio.assetmanagement.application.transfer.mapper.TransferMapper;
import com.portfolio.assetmanagement.application.transfer.service.TransferQueryService;
import com.portfolio.assetmanagement.application.transfer.service.TransferService;
import com.portfolio.assetmanagement.domain.transfer.entity.TransferRequest;
import com.portfolio.assetmanagement.domain.transfer.enums.TransferStatus;
import com.portfolio.assetmanagement.shared.pagination.PageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.stream.Collectors;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Transfers", description = "Transferências de ativos entre unidades")
@RestController
@RequestMapping("/transfers")
public class TransferController {

  private final TransferService transferService;
  private final TransferQueryService queryService;
  private final TransferMapper transferMapper;

  public TransferController(
      TransferService transferService,
      TransferQueryService queryService,
      TransferMapper transferMapper) {
    this.transferService = transferService;
    this.queryService = queryService;
    this.transferMapper = transferMapper;
  }

  @Operation(
      summary = "Listar transferências",
      description =
          """
      Lista transferências com filtros opcionais e paginação.
      Filtros: status, assetId, unitId, startDate, endDate.
      ADMIN vê todas; GESTOR vê as da sua unidade (origem + destino).
      O parâmetro unitId permite ao ADMIN filtrar por unidade específica.
      """)
  @GetMapping
  public PageResponse<TransferResponseDTO> list(
      @Parameter(description = "Status da transferência") @RequestParam(required = false)
          TransferStatus status,
      @Parameter(description = "ID do ativo") @RequestParam(required = false) Long assetId,
      @Parameter(description = "ID da unidade (origem ou destino)") @RequestParam(required = false)
          Long unitId,
      @Parameter(description = "Data início (yyyy-MM-dd)")
          @RequestParam(required = false)
          @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
          LocalDate startDate,
      @Parameter(description = "Data fim (yyyy-MM-dd)")
          @RequestParam(required = false)
          @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
          LocalDate endDate,
      @ParameterObject Pageable pageable) {

    Page<TransferRequest> page =
        queryService.list(status, assetId, unitId, startDate, endDate, pageable);

    return PageResponse.from(
        page,
        page.getContent().stream().map(transferMapper::toResponseDTO).collect(Collectors.toList()));
  }

  @Operation(summary = "Solicitar transferência")
  @PreAuthorize("hasAnyRole('ADMIN','GESTOR')")
  @PostMapping
  public ResponseEntity<TransferResponseDTO> request(@RequestBody @Valid TransferCreateDTO dto) {
    return ResponseEntity.status(HttpStatus.CREATED)
        .body(
            transferMapper.toResponseDTO(
                transferService.request(dto.getAssetId(), dto.getToUnitId(), dto.getReason())));
  }

  @Operation(summary = "Aprovar transferência")
  @PreAuthorize("hasAnyRole('ADMIN','GESTOR')")
  @PatchMapping("/{id}/approve")
  public ResponseEntity<Void> approve(
      @PathVariable Long id, @RequestBody(required = false) TransferApproveDTO dto) {
    transferService.approve(id, dto != null ? dto.getComment() : null);
    return ResponseEntity.noContent().build();
  }

  @Operation(summary = "Rejeitar transferência")
  @PreAuthorize("hasAnyRole('ADMIN','GESTOR')")
  @PatchMapping("/{id}/reject")
  public ResponseEntity<Void> reject(
      @PathVariable Long id, @RequestBody(required = false) TransferApproveDTO dto) {
    transferService.reject(id, dto != null ? dto.getComment() : null);
    return ResponseEntity.noContent().build();
  }

  @Operation(summary = "Concluir transferência")
  @PatchMapping("/{id}/complete")
  public ResponseEntity<Void> complete(@PathVariable Long id) {
    transferService.complete(id);
    return ResponseEntity.noContent().build();
  }

  @Operation(summary = "Cancelar transferência",
      description = "Cancela uma transferência pendente. Somente transferências PENDING podem ser canceladas.")
  @PatchMapping("/{id}/cancel")
  public ResponseEntity<Void> cancel(@PathVariable Long id) {
    transferService.cancel(id);
    return ResponseEntity.noContent().build();
  }
}
