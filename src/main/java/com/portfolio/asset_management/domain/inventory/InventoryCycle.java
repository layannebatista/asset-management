package com.portfolio.asset_management.domain.inventory;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.*;

@Entity
@Table(name = "inventory_cycles")
public class InventoryCycle {

  @Id @GeneratedValue private UUID id;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private InventoryStatus status;

  @Column(nullable = false)
  private LocalDateTime startedAt;

  private LocalDateTime closedAt;

  @OneToMany(mappedBy = "inventoryCycle", cascade = CascadeType.ALL, orphanRemoval = true)
  private List<InventoryItem> items = new ArrayList<>();

  protected InventoryCycle() {
    // JPA
  }

  private InventoryCycle(LocalDateTime startedAt) {
    this.status = InventoryStatus.ABERTO;
    this.startedAt = startedAt;
  }

  /* ===================== FACTORY ===================== */

  public static InventoryCycle iniciar() {
    return new InventoryCycle(LocalDateTime.now());
  }

  /* ================= REGRAS DE NEGÓCIO ================= */

  public void adicionarItem(InventoryItem item) {
    assertAberto();

    if (item == null) {
      throw new IllegalArgumentException("Item de inventário é obrigatório");
    }

    boolean duplicado = items.stream().anyMatch(i -> i.getAssetId().equals(item.getAssetId()));

    if (duplicado) {
      throw new IllegalStateException("Ativo já adicionado ao ciclo de inventário");
    }

    item.associarAoCiclo(this);
    items.add(item);
  }

  public void fechar() {
    assertAberto();

    if (items.isEmpty()) {
      throw new IllegalStateException("Inventário não pode ser fechado sem itens");
    }

    boolean naoVerificado = items.stream().anyMatch(item -> !item.isVerificado());

    if (naoVerificado) {
      throw new IllegalStateException("Inventário não pode ser fechado com itens não verificados");
    }

    this.status = InventoryStatus.FECHADO;
    this.closedAt = LocalDateTime.now();
  }

  /* ===================== APOIO ===================== */

  private void assertAberto() {
    if (status != InventoryStatus.ABERTO) {
      throw new IllegalStateException("Operação permitida apenas com inventário aberto");
    }
  }

  public boolean isAberto() {
    return status == InventoryStatus.ABERTO;
  }

  /* ===================== GETTERS ===================== */

  public UUID getId() {
    return id;
  }

  public InventoryStatus getStatus() {
    return status;
  }

  public LocalDateTime getStartedAt() {
    return startedAt;
  }

  public LocalDateTime getClosedAt() {
    return closedAt;
  }

  public List<InventoryItem> getItems() {
    return List.copyOf(items);
  }
}
