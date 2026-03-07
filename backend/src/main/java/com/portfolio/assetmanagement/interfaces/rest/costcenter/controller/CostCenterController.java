package com.portfolio.assetmanagement.interfaces.rest.costcenter.controller;

import com.portfolio.assetmanagement.application.costcenter.service.CostCenterService;
import com.portfolio.assetmanagement.domain.costcenter.entity.CostCenter;
import com.portfolio.assetmanagement.security.context.LoggedUserContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@Tag(
    name = "Cost Centers",
    description =
        """
    Centros de custo para controle de OPEX/CAPEX por departamento.
    Permite alocação de ativos e manutenções a projetos e áreas.
    """)
@RestController
@RequestMapping("/cost-centers")
@PreAuthorize("hasRole('ADMIN')")
public class CostCenterController {

  private final CostCenterService service;
  private final LoggedUserContext loggedUser;

  public CostCenterController(CostCenterService service, LoggedUserContext loggedUser) {
    this.service = service;
    this.loggedUser = loggedUser;
  }

  @Operation(summary = "Listar centros de custo ativos")
  @GetMapping
  public List<CostCenter> list() {
    return service.listActive(loggedUser.getOrganizationId());
  }

  @Operation(summary = "Criar centro de custo")
  @PostMapping
  public ResponseEntity<CostCenter> create(@RequestBody @Valid CostCenterCreateRequest req) {

    CostCenter cc =
        service.create(loggedUser.getOrganizationId(), req.unitId(), req.code(), req.name());

    return ResponseEntity.status(HttpStatus.CREATED).body(cc);
  }

  @Operation(summary = "Desativar centro de custo")
  @PatchMapping("/{id}/deactivate")
  public ResponseEntity<Void> deactivate(@PathVariable Long id) {

    service.deactivate(id);

    return ResponseEntity.noContent().build();
  }

  record CostCenterCreateRequest(@NotBlank String code, @NotBlank String name, Long unitId) {}
}
