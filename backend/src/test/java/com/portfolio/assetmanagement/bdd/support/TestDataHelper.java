package com.portfolio.assetmanagement.bdd.support;

import com.portfolio.assetmanagement.domain.asset.entity.Asset;
import com.portfolio.assetmanagement.domain.asset.enums.AssetStatus;
import com.portfolio.assetmanagement.domain.asset.enums.AssetType;
import com.portfolio.assetmanagement.domain.organization.entity.Organization;
import com.portfolio.assetmanagement.domain.unit.entity.Unit;
import com.portfolio.assetmanagement.domain.user.entity.User;
import com.portfolio.assetmanagement.infrastructure.persistence.asset.repository.AssetRepository;
import com.portfolio.assetmanagement.infrastructure.persistence.maintenance.repository.MaintenanceRepository;
import com.portfolio.assetmanagement.infrastructure.persistence.organization.repository.OrganizationRepository;
import com.portfolio.assetmanagement.infrastructure.persistence.unit.repository.UnitRepository;
import com.portfolio.assetmanagement.infrastructure.persistence.user.repository.UserRepository;
import com.portfolio.assetmanagement.security.enums.UserRole;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * CAMADA 3 — Helper de setup de dados para os cenários BDD.
 *
 * <p>Responsabilidade única: criar entidades diretamente no banco via repositórios, sem passar
 * pelos services (que têm validações de negócio e exigem contexto de usuário).
 *
 * <p>POR QUE NÃO USAR OS SERVICES PARA CRIAR OS DADOS? Os services usam LoggedUserContext
 * (@RequestScope), que não existe fora de uma request HTTP. Criar dados de teste via repositório
 * diretamente é mais simples, rápido e não tem dependência de contexto de segurança.
 *
 * <p>CICLO DE VIDA: - @Before de cada cenário chama cleanDatabase() + cria os dados necessários
 * - @After não precisa limpar — o Testcontainers roda migrations a cada build e cada cenário deve
 * ser independente (cleanDatabase no @Before garante isso)
 *
 * <p>PADRÃO DE USO NOS STEPS: @Before public void setup() { testDataHelper.cleanDatabase(); org =
 * testDataHelper.criarOrganizacao("Acme Corp"); unit = testDataHelper.criarUnidade("Unidade
 * Central", org); admin = testDataHelper.criarUsuarioAtivo("admin@acme.com", "Senha@123",
 * UserRole.ADMIN, org, unit); }
 */
@Component
public class TestDataHelper {

  private final OrganizationRepository organizationRepository;
  private final UnitRepository unitRepository;
  private final UserRepository userRepository;
  private final AssetRepository assetRepository;
  private final MaintenanceRepository maintenanceRepository;
  private final PasswordEncoder passwordEncoder;

  public TestDataHelper(
      OrganizationRepository organizationRepository,
      UnitRepository unitRepository,
      UserRepository userRepository,
      AssetRepository assetRepository,
      MaintenanceRepository maintenanceRepository,
      PasswordEncoder passwordEncoder) {
    this.organizationRepository = organizationRepository;
    this.unitRepository = unitRepository;
    this.userRepository = userRepository;
    this.assetRepository = assetRepository;
    this.maintenanceRepository = maintenanceRepository;
    this.passwordEncoder = passwordEncoder;
  }

  // =========================================================
  // LIMPEZA — chamada no @Before de cada cenário
  // =========================================================

  /**
   * Limpa todas as tabelas na ordem correta (respeitando foreign keys).
   *
   * <p>A ordem importa: primeiro as tabelas filhas, depois as pais. Sem isso, as constraints de FK
   * vão lançar DataIntegrityViolationException.
   */
  @Transactional
  public void cleanDatabase() {
    maintenanceRepository.deleteAll();
    assetRepository.deleteAll();
    userRepository.deleteAll();
    unitRepository.deleteAll();
    organizationRepository.deleteAll();
  }

  // =========================================================
  // ORGANIZAÇÃO
  // =========================================================

  @Transactional
  public Organization criarOrganizacao(String nome) {
    Organization org = new Organization(nome);
    return organizationRepository.save(org);
  }

  // =========================================================
  // UNIDADE
  // =========================================================

  @Transactional
  public Unit criarUnidade(String nome, Organization org) {
    Unit unit = new Unit(nome, org, false);
    return unitRepository.save(unit);
  }

  @Transactional
  public Unit criarUnidadePrincipal(String nome, Organization org) {
    Unit unit = new Unit(nome, org, true);
    return unitRepository.save(unit);
  }

  // =========================================================
  // USUÁRIO
  // =========================================================

  /**
   * Cria usuário já ACTIVE com senha pronta para login.
   *
   * <p>A senha é hasheada com BCrypt — o mesmo encoder que o AuthService usa. Isso garante que o
   * login via /auth/login funcione nos cenários.
   */
  @Transactional
  public User criarUsuarioAtivo(
      String email, String senhaPlain, UserRole role, Organization org, Unit unit) {

    User user =
        new User(
            "Usuário Teste",
            email,
            passwordEncoder.encode(senhaPlain),
            role,
            org,
            unit,
            "12345678901");

    // Ativa diretamente — sem passar pelo fluxo de token de ativação
    user.activate();
    return userRepository.save(user);
  }

  /** Cria usuário ADMIN — atalho semântico mais legível nos steps. */
  @Transactional
  public User criarAdmin(String email, String senha, Organization org, Unit unit) {
    return criarUsuarioAtivo(email, senha, UserRole.ADMIN, org, unit);
  }

  /** Cria usuário GESTOR. */
  @Transactional
  public User criarGestor(String email, String senha, Organization org, Unit unit) {
    return criarUsuarioAtivo(email, senha, UserRole.GESTOR, org, unit);
  }

  /** Cria usuário OPERADOR. */
  @Transactional
  public User criarOperador(String email, String senha, Organization org, Unit unit) {
    return criarUsuarioAtivo(email, senha, UserRole.OPERADOR, org, unit);
  }

  // =========================================================
  // ATIVO
  // =========================================================

  @Transactional
  public Asset criarAtivo(String assetTag, AssetType tipo, Organization org, Unit unit) {
    Asset asset = new Asset(assetTag, tipo, "Modelo Teste", org, unit);
    return assetRepository.save(asset);
  }

  @Transactional
  public Asset criarAtivoDisponivel(Organization org, Unit unit) {
    return criarAtivo("ASSET-TEST-001", AssetType.NOTEBOOK, org, unit);
  }

  /**
   * Cria ativo já em manutenção — para testar cenários onde o ativo não pode receber nova
   * manutenção.
   */
  @Transactional
  public Asset criarAtivoEmManutencao(Organization org, Unit unit) {
    Asset asset = criarAtivo("ASSET-MANUT-001", AssetType.NOTEBOOK, org, unit);
    asset.changeStatus(AssetStatus.IN_MAINTENANCE);
    return assetRepository.save(asset);
  }

  /** Cria ativo aposentado — para testar que RETIRED bloqueia novas manutenções. */
  @Transactional
  public Asset criarAtivoAposentado(Organization org, Unit unit) {
    Asset asset = criarAtivo("ASSET-RETIRED-001", AssetType.NOTEBOOK, org, unit);
    asset.changeStatus(AssetStatus.RETIRED);
    return assetRepository.save(asset);
  }
}
