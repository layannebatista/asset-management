package com.portfolio.asset_management.api.controller;

import com.portfolio.asset_management.application.service.TransferService;
import com.portfolio.asset_management.domain.transfer.TransferRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/transfers")
public class TransferController {

    private final TransferService transferService;

    public TransferController(TransferService transferService) {
        this.transferService = transferService;
    }

    /* ======================================================
       SOLICITAR TRANSFERÊNCIA
       ====================================================== */

    @PostMapping("/request")
    public ResponseEntity<TransferRequest> requestTransfer(
            @RequestParam UUID assetId,
            @RequestParam UUID toUnitId,
            @RequestParam UUID toResponsibleUserId,
            @RequestParam UUID requestedBy
    ) {
        TransferRequest request = transferService.requestTransfer(
                assetId,
                toUnitId,
                toResponsibleUserId,
                requestedBy
        );
        return ResponseEntity.ok(request);
    }

    /* ======================================================
       APROVAR TRANSFERÊNCIA
       ====================================================== */

    @PostMapping("/{transferRequestId}/approve")
    public ResponseEntity<Void> approveTransfer(
            @PathVariable UUID transferRequestId,
            @RequestParam UUID approverId
    ) {
        transferService.approveTransfer(transferRequestId, approverId);
        return ResponseEntity.ok().build();
    }

    /* ======================================================
       REJEITAR TRANSFERÊNCIA
       ====================================================== */

    @PostMapping("/{transferRequestId}/reject")
    public ResponseEntity<Void> rejectTransfer(
            @PathVariable UUID transferRequestId,
            @RequestParam UUID approverId,
            @RequestParam String reason
    ) {
        transferService.rejectTransfer(transferRequestId, approverId, reason);
        return ResponseEntity.ok().build();
    }
}
