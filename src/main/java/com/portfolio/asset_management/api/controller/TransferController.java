package com.portfolio.asset_management.api.controller;

import com.portfolio.asset_management.application.service.TransferService;
import com.portfolio.asset_management.domain.transfer.TransferApproval;
import com.portfolio.asset_management.domain.transfer.TransferRequest;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

/**
 * Controller REST do módulo de Transferência.
 *
 * Expõe endpoints semânticos alinhados ao processo de negócio.
 * Nenhuma regra de negócio deve existir aqui.
 *
 */
@RestController
@RequestMapping("/transfer-requests")
public class TransferController {

  private final TransferService transferService;

  public TransferController(TransferService transferService) {
    this.transferService = transferService;
  }

  /* ======================================================
     CRIAR TRANSFER REQUEST
     ====================================================== */

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public TransferRequest criarTransferRequest(
      @RequestParam UUID assetId,
      @RequestParam UUID destinationUnitId,
      @RequestParam UUID requestedBy) {

    return transferService.criarTransferRequest(
        assetId,
        destinationUnitId,
        requestedBy);
  }

  /* ======================================================
     SOLICITAR APROVAÇÃO
     ====================================================== */

  @PostMapping("/{requestId}/solicitar-aprovacao")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void solicitarAprovacao(@PathVariable UUID requestId) {
    transferService.solicitarAprovacao(requestId);
  }

  /* ======================================================
     APROVAR TRANSFERÊNCIA
     ====================================================== */

  @PostMapping("/{requestId}/aprovar")
  public TransferApproval aprovarTransferencia(
      @PathVariable UUID requestId,
      @RequestParam UUID approvedBy,
      @RequestParam(required = false) String comment) {

    return transferService.aprovarTransferencia(
        requestId,
        approvedBy,
        comment);
  }

  /* ======================================================
     REJEITAR TRANSFERÊNCIA
     ====================================================== */

  @PostMapping("/{requestId}/rejeitar")
  public TransferApproval rejeitarTransferencia(
      @PathVariable UUID requestId,
      @RequestParam UUID rejectedBy,
      @RequestParam String reason) {

    return transferService.rejeitarTransferencia(
        requestId,
        rejectedBy,
        reason);
  }

  /* ======================================================
     EXECUTAR TRANSFERÊNCIA
     ====================================================== */

  @PostMapping("/{requestId}/executar")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void executarTransferencia(
      @PathVariable UUID requestId,
      @RequestParam UUID newResponsibleUserId) {

    transferService.executarTransferencia(
        requestId,
        newResponsibleUserId);
  }

  /* ======================================================
     CANCELAR TRANSFERÊNCIA
     ====================================================== */

  @PostMapping("/{requestId}/cancelar")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void cancelarTransferencia(
      @PathVariable UUID requestId,
      @RequestParam UUID cancelledBy,
      @RequestParam String reason) {

    transferService.cancelarTransferencia(
        requestId,
        cancelledBy,
        reason);
  }

  /* ======================================================
     CONSULTAS
     ====================================================== */

  @GetMapping("/{requestId}")
  public TransferRequest buscarPorId(@PathVariable UUID requestId) {
    return transferService.getTransferRequest(requestId);
  }

  @GetMapping
  public List<TransferRequest> listarPorAsset(@RequestParam UUID assetId) {
    return transferService.listarPorAsset(assetId);
  }
}
