package com.portfolio.assetmanagement.interfaces.rest.insurance.controller;

import com.portfolio.assetmanagement.application.insurance.dto.InsuranceCreateDTO;
import com.portfolio.assetmanagement.application.insurance.dto.InsuranceSummaryDTO;
import com.portfolio.assetmanagement.application.insurance.service.InsuranceService;
import com.portfolio.assetmanagement.domain.insurance.entity.AssetInsurance;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Insurance", description = "Gerenciamento de apólices de seguro de ativos")
@RestController
@RequestMapping("/assets")
public class InsuranceController {

  private final InsuranceService insuranceService;

  public InsuranceController(InsuranceService insuranceService) {
    this.insuranceService = insuranceService;
  }

  @Operation(summary = "Registrar apólice de seguro para um ativo")
  @PostMapping("/{assetId}/insurance")
  @PreAuthorize("hasAnyRole('ADMIN','GESTOR')")
  public ResponseEntity<AssetInsurance> register(
      @Parameter(description = "ID do ativo") @PathVariable Long assetId,
      @RequestBody @Valid InsuranceCreateDTO dto) {
    return ResponseEntity.status(HttpStatus.CREATED).body(insuranceService.register(assetId, dto));
  }

  @Operation(summary = "Remover apólice de seguro")
  @DeleteMapping("/insurance/{insuranceId}")
  @PreAuthorize("hasAnyRole('ADMIN','GESTOR')")
  public ResponseEntity<Void> delete(
      @Parameter(description = "ID da apólice") @PathVariable Long insuranceId) {
    insuranceService.delete(insuranceId);
    return ResponseEntity.noContent().build();
  }

  @Operation(summary = "Listar todas as apólices de um ativo")
  @GetMapping("/{assetId}/insurance")
  public ResponseEntity<List<AssetInsurance>> listByAsset(@PathVariable Long assetId) {
    return ResponseEntity.ok(insuranceService.listByAsset(assetId));
  }

  @Operation(summary = "Consultar apólice ativa de um ativo")
  @GetMapping("/{assetId}/insurance/active")
  public ResponseEntity<AssetInsurance> getActive(@PathVariable Long assetId) {
    return ResponseEntity.ok(insuranceService.getActive(assetId));
  }

  @Operation(summary = "Listar apólices vencendo em breve")
  @GetMapping("/insurance/expiring")
  @PreAuthorize("hasAnyRole('ADMIN','GESTOR')")
  public ResponseEntity<List<AssetInsurance>> getExpiring(
      @RequestParam(defaultValue = "30") int days) {
    return ResponseEntity.ok(insuranceService.getExpiringSoon(days));
  }

  @Operation(summary = "Resumo de seguros da organização")
  @GetMapping("/insurance/summary")
  @PreAuthorize("hasAnyRole('ADMIN','GESTOR')")
  public ResponseEntity<InsuranceSummaryDTO> getSummary() {
    return ResponseEntity.ok(insuranceService.getSummary());
  }
}