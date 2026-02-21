package com.portfolio.assetmanagement.interfaces.rest.transfer.controller;

import com.portfolio.assetmanagement.application.transfer.dto.TransferApproveDTO;
import com.portfolio.assetmanagement.application.transfer.dto.TransferCreateDTO;
import com.portfolio.assetmanagement.application.transfer.service.TransferService;
import com.portfolio.assetmanagement.domain.transfer.entity.TransferRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.*;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@Tag(
    name = "Transfers",
    description = "Fluxo completo de solicitações e aprovações de transferência de ativos")
@RestController
@RequestMapping("/transfers")
public class TransferController {

  private final TransferService service;

  public TransferController(TransferService service) {
    this.service = service;
  }

  /* ============================================================
   *  SOLICITAR TRANSFERÊNCIA
   * ============================================================ */

  @Operation(
      summary = "Solicitar transferência de ativo",
      description =
          """
          Cria uma nova solicitação de transferência de ativo entre unidades.

          Regras:
          - O ativo deve existir
          - A unidade de destino deve existir
          - O ativo não pode estar aposentado
          - A solicitação inicia no status PENDING

          Acesso: ADMIN ou MANAGER.
          """)
  @ApiResponses({
    @ApiResponse(responseCode = "200", description = "Solicitação criada com sucesso"),
    @ApiResponse(responseCode = "400", description = "Dados inválidos"),
    @ApiResponse(responseCode = "404", description = "Ativo ou unidade não encontrada"),
    @ApiResponse(responseCode = "409", description = "Estado inválido do ativo")
  })
  @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
  @PostMapping
  public TransferRequest create(@RequestBody @Valid TransferCreateDTO dto) {

    validateCreateDTO(dto);

    return service.request(dto.getAssetId(), dto.getToUnitId(), dto.getReason());
  }

  /* ============================================================
   *  LISTAR TRANSFERÊNCIAS
   * ============================================================ */

  @Operation(
      summary = "Listar transferências visíveis ao usuário",
      description =
          """
          Retorna as solicitações de transferência visíveis ao usuário autenticado.

          Multi-tenant safe.
          """)
  @PreAuthorize("hasAnyRole('ADMIN','MANAGER','OPERATOR')")
  @GetMapping
  public List<TransferRequest> list() {
    return service.list();
  }

  /* ============================================================
   *  APROVAR TRANSFERÊNCIA
   * ============================================================ */

  @Operation(
      summary = "Aprovar transferência",
      description =
          """
          Aprova uma solicitação de transferência.

          Regras:
          - Deve estar no status PENDING
          - Pode registrar comentário
          - Move para status APPROVED
          """)
  @ApiResponses({
    @ApiResponse(responseCode = "200", description = "Transferência aprovada"),
    @ApiResponse(responseCode = "404", description = "Transferência não encontrada"),
    @ApiResponse(responseCode = "409", description = "Transição de status inválida")
  })
  @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
  @PatchMapping("/{id}/approve")
  public void approve(
      @Parameter(description = "ID da transferência", example = "1") @PathVariable @NotNull Long id,
      @RequestBody @Valid TransferApproveDTO dto) {

    validateApproveDTO(dto);

    service.approve(id, dto.getComment());
  }

  /* ============================================================
   *  REJEITAR TRANSFERÊNCIA
   * ============================================================ */

  @Operation(
      summary = "Rejeitar transferência",
      description =
          """
          Rejeita uma solicitação de transferência.

          Regras:
          - Deve estar no status PENDING
          - Pode registrar comentário
          - Move para status REJECTED
          """)
  @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
  @PatchMapping("/{id}/reject")
  public void reject(
      @Parameter(description = "ID da transferência", example = "1") @PathVariable @NotNull Long id,
      @RequestBody @Valid TransferApproveDTO dto) {

    validateApproveDTO(dto);

    service.reject(id, dto.getComment());
  }

  /* ============================================================
   *  COMPLETAR TRANSFERÊNCIA
   * ============================================================ */

  @Operation(
      summary = "Completar transferência",
      description =
          """
          Finaliza a transferência aprovada.

          Regras:
          - Deve estar no status APPROVED
          - Atualiza unidade do ativo
          - Move para status COMPLETED
          """)
  @ApiResponses({
    @ApiResponse(responseCode = "200", description = "Transferência concluída"),
    @ApiResponse(responseCode = "409", description = "Estado inválido para conclusão")
  })
  @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
  @PatchMapping("/{id}/complete")
  public void complete(
      @Parameter(description = "ID da transferência", example = "1") @PathVariable @NotNull
          Long id) {

    service.complete(id);
  }

  /* ============================================================
   *  VALIDAÇÕES DEFENSIVAS
   * ============================================================ */

  private void validateCreateDTO(TransferCreateDTO dto) {

    if (dto.getAssetId() == null) {
      throw new IllegalArgumentException("assetId é obrigatório");
    }

    if (dto.getToUnitId() == null) {
      throw new IllegalArgumentException("toUnitId é obrigatório");
    }
  }

  private void validateApproveDTO(TransferApproveDTO dto) {

    if (dto == null) {
      throw new IllegalArgumentException("DTO é obrigatório");
    }
  }
}
