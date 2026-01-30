package com.portfolio.asset_management.api.controller;

import com.portfolio.asset_management.application.service.AssetService;
import com.portfolio.asset_management.domain.asset.Asset;
import com.portfolio.asset_management.domain.asset.AssetLifecycleEvent;
import com.portfolio.asset_management.domain.asset.AssetStatus;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

/**
 * Controller REST do módulo Asset.
 *
 * <p>Responsável apenas por expor endpoints HTTP. Nenhuma regra de negócio deve existir aqui.
 */
@RestController
@RequestMapping("/assets")
public class AssetController {

  private final AssetService assetService;

  public AssetController(AssetService assetService) {
    this.assetService = assetService;
  }

  /* ======================================================
  CADASTRO
  ====================================================== */

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public Asset cadastrar(@RequestParam String assetCode) {
    return assetService.cadastrarAsset(assetCode);
  }

  /* ======================================================
  ATIVAÇÃO
  ====================================================== */

  @PostMapping("/{assetId}/ativar")
  public Asset ativar(
      @PathVariable UUID assetId,
      @RequestParam UUID unitId,
      @RequestParam UUID responsibleUserId,
      @RequestParam(required = false) UUID triggeredBy) {

    return assetService.ativarAsset(assetId, unitId, responsibleUserId, triggeredBy);
  }

  /* ======================================================
  TRANSFERÊNCIA
  ====================================================== */

  @PostMapping("/{assetId}/transferencia/solicitar")
  public Asset solicitarTransferencia(
      @PathVariable UUID assetId, @RequestParam(required = false) UUID triggeredBy) {

    return assetService.solicitarTransferencia(assetId, triggeredBy);
  }

  @PostMapping("/{assetId}/transferencia/aprovar")
  public Asset aprovarTransferencia(
      @PathVariable UUID assetId, @RequestParam(required = false) UUID triggeredBy) {

    return assetService.aprovarTransferencia(assetId, triggeredBy);
  }

  @PostMapping("/{assetId}/transferencia/rejeitar")
  public Asset rejeitarTransferencia(
      @PathVariable UUID assetId, @RequestParam(required = false) UUID triggeredBy) {

    return assetService.rejeitarTransferencia(assetId, triggeredBy);
  }

  @PostMapping("/{assetId}/transferencia/confirmar-recebimento")
  public Asset confirmarRecebimento(
      @PathVariable UUID assetId,
      @RequestParam UUID newUnitId,
      @RequestParam UUID newResponsibleUserId,
      @RequestParam(required = false) UUID triggeredBy) {

    return assetService.confirmarRecebimento(assetId, newUnitId, newResponsibleUserId, triggeredBy);
  }

  /* ======================================================
  MANUTENÇÃO
  ====================================================== */

  @PostMapping("/{assetId}/manutencao/enviar")
  public Asset enviarParaManutencao(
      @PathVariable UUID assetId, @RequestParam(required = false) UUID triggeredBy) {

    return assetService.enviarParaManutencao(assetId, triggeredBy);
  }

  @PostMapping("/{assetId}/manutencao/retornar")
  public Asset retornarDaManutencao(
      @PathVariable UUID assetId, @RequestParam(required = false) UUID triggeredBy) {

    return assetService.retornarDaManutencao(assetId, triggeredBy);
  }

  /* ======================================================
  INVENTÁRIO
  ====================================================== */

  @PostMapping("/{assetId}/inventario/iniciar")
  public Asset iniciarInventario(
      @PathVariable UUID assetId, @RequestParam(required = false) UUID triggeredBy) {

    return assetService.iniciarInventario(assetId, triggeredBy);
  }

  @PostMapping("/{assetId}/inventario/confirmar-localizado")
  public Asset confirmarLocalizado(
      @PathVariable UUID assetId, @RequestParam(required = false) UUID triggeredBy) {

    return assetService.confirmarLocalizado(assetId, triggeredBy);
  }

  @PostMapping("/{assetId}/inventario/nao-localizado")
  public Asset marcarNaoLocalizado(
      @PathVariable UUID assetId, @RequestParam(required = false) UUID triggeredBy) {

    return assetService.marcarNaoLocalizado(assetId, triggeredBy);
  }

  @PostMapping("/{assetId}/localizar")
  public Asset localizarAtivo(
      @PathVariable UUID assetId, @RequestParam(required = false) UUID triggeredBy) {

    return assetService.localizarAtivo(assetId, triggeredBy);
  }

  /* ======================================================
  BAIXA
  ====================================================== */

  @PostMapping("/{assetId}/baixar")
  public Asset baixar(
      @PathVariable UUID assetId,
      @RequestParam String reason,
      @RequestParam(required = false) UUID triggeredBy) {

    return assetService.baixarAsset(assetId, reason, triggeredBy);
  }

  /* ======================================================
  CONSULTAS
  ====================================================== */

  @GetMapping("/{assetId}")
  public Asset buscarPorId(@PathVariable UUID assetId) {
    return assetService.getAssetById(assetId);
  }

  @GetMapping
  public List<Asset> listar(@RequestParam(required = false) AssetStatus status) {
    return assetService.listAssets(status);
  }

  @GetMapping("/{assetId}/lifecycle")
  public List<AssetLifecycleEvent> historico(@PathVariable UUID assetId) {
    return assetService.getLifecycleHistory(assetId);
  }
}
