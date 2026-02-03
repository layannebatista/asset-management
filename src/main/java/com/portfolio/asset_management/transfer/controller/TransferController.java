package com.portfolio.asset_management.transfer.controller;

import com.portfolio.asset_management.transfer.dto.TransferApproveDTO;
import com.portfolio.asset_management.transfer.dto.TransferCreateDTO;
import com.portfolio.asset_management.transfer.entity.TransferRequest;
import com.portfolio.asset_management.transfer.service.TransferService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/** Controller REST responsável por expor o fluxo de transferências. */
@RestController
@RequestMapping("/transfers")
public class TransferController {

  private final TransferService service;

  public TransferController(TransferService service) {
    this.service = service;
  }

  @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
  @PostMapping
  public TransferRequest create(@RequestBody @Valid TransferCreateDTO dto) {
    return service.request(dto.getAssetId(), dto.getToUnitId(), dto.getReason());
  }

  @GetMapping
  public List<TransferRequest> list() {
    return service.list();
  }

  @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
  @PatchMapping("/{id}/approve")
  public void approve(@PathVariable Long id, @RequestBody TransferApproveDTO dto) {

    service.approve(id, dto.getComment());
  }

  @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
  @PatchMapping("/{id}/reject")
  public void reject(@PathVariable Long id, @RequestBody TransferApproveDTO dto) {

    service.reject(id, dto.getComment());
  }
}
