package com.portfolio.asset_management.transfer.controller;

import com.portfolio.asset_management.transfer.dto.TransferApproveDTO;
import com.portfolio.asset_management.transfer.dto.TransferCreateDTO;
import com.portfolio.asset_management.transfer.entity.TransferRequest;
import com.portfolio.asset_management.transfer.service.TransferService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Controller REST responsável por expor o fluxo de transferências.
 *
 * <p>Endpoints seguros, validados e compatíveis com arquitetura enterprise.
 */
@RestController
@RequestMapping("/transfers")
public class TransferController {

  private final TransferService service;

  public TransferController(TransferService service) {

    this.service = service;
  }

  /** Solicita transferência de asset. */
  @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
  @PostMapping
  public TransferRequest create(@RequestBody @Valid TransferCreateDTO dto) {

    validateCreateDTO(dto);

    return service.request(dto.getAssetId(), dto.getToUnitId(), dto.getReason());
  }

  /** Lista transferências visíveis ao usuário. */
  @PreAuthorize("hasAnyRole('ADMIN','MANAGER','OPERATOR')")
  @GetMapping
  public List<TransferRequest> list() {

    return service.list();
  }

  /** Aprova transferência. */
  @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
  @PatchMapping("/{id}/approve")
  public void approve(@PathVariable @NotNull Long id, @RequestBody @Valid TransferApproveDTO dto) {

    validateApproveDTO(dto);

    service.approve(id, dto.getComment());
  }

  /** Rejeita transferência. */
  @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
  @PatchMapping("/{id}/reject")
  public void reject(@PathVariable @NotNull Long id, @RequestBody @Valid TransferApproveDTO dto) {

    validateApproveDTO(dto);

    service.reject(id, dto.getComment());
  }

  /** Completa transferência. */
  @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
  @PatchMapping("/{id}/complete")
  public void complete(@PathVariable @NotNull Long id) {

    service.complete(id);
  }

  /** Validação defensiva do DTO de criação. */
  private void validateCreateDTO(TransferCreateDTO dto) {

    if (dto.getAssetId() == null) {

      throw new IllegalArgumentException("assetId é obrigatório");
    }

    if (dto.getToUnitId() == null) {

      throw new IllegalArgumentException("toUnitId é obrigatório");
    }
  }

  /** Validação defensiva do DTO de aprovação/rejeição. */
  private void validateApproveDTO(TransferApproveDTO dto) {

    if (dto == null) {

      throw new IllegalArgumentException("DTO é obrigatório");
    }
  }
}
