package com.portfolio.assetmanagement.bdd.support;

import com.portfolio.assetmanagement.domain.asset.entity.Asset;
import com.portfolio.assetmanagement.domain.asset.enums.AssetStatus;
import com.portfolio.assetmanagement.domain.asset.enums.AssetType;
import com.portfolio.assetmanagement.domain.mfa.entity.MfaCode;
import com.portfolio.assetmanagement.domain.organization.entity.Organization;
import com.portfolio.assetmanagement.domain.unit.entity.Unit;
import com.portfolio.assetmanagement.domain.user.entity.User;
import com.portfolio.assetmanagement.domain.user.enums.UserStatus;
import com.portfolio.assetmanagement.infrastructure.persistence.asset.repository.AssetRepository;
import com.portfolio.assetmanagement.infrastructure.persistence.maintenance.repository.MaintenanceRepository;
import com.portfolio.assetmanagement.infrastructure.persistence.mfa.repository.MfaCodeRepository;
import com.portfolio.assetmanagement.infrastructure.persistence.organization.repository.OrganizationRepository;
import com.portfolio.assetmanagement.infrastructure.persistence.transfer.repository.TransferRepository;
import com.portfolio.assetmanagement.infrastructure.persistence.unit.repository.UnitRepository;
import com.portfolio.assetmanagement.infrastructure.persistence.user.repository.UserRepository;
import com.portfolio.assetmanagement.security.enums.UserRole;
import java.time.Instant;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
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
  private final TransferRepository transferRepository;
  private final MfaCodeRepository mfaCodeRepository;
  private final PasswordEncoder passwordEncoder;

  public TestDataHelper(
      OrganizationRepository organizationRepository,
      UnitRepository unitRepository,
      UserRepository userRepository,
      AssetRepository assetRepository,
      MaintenanceRepository maintenanceRepository,
      TransferRepository transferRepository,
      MfaCodeRepository mfaCodeRepository,
      PasswordEncoder passwordEncoder) {
    this.organizationRepository = organizationRepository;
    this.unitRepository = unitRepository;
    this.userRepository = userRepository;
    this.assetRepository = assetRepository;
    this.maintenanceRepository = maintenanceRepository;
    this.transferRepository = transferRepository;
    this.mfaCodeRepository = mfaCodeRepository;
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
    transferRepository.deleteAll();
    maintenanceRepository.deleteAll();
    mfaCodeRepository.deleteAll();
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

  public Organization obterOrganizacao(Long id) {
    return organizationRepository
        .findById(id)
        .orElseThrow(() -> new IllegalArgumentException("Organização não encontrada: " + id));
  }

  // =========================================================
  // UNIDADE
  // =========================================================

  @Transactional
  public Unit criarUnidade(String nome, Organization org) {
    Unit unit = new Unit(nome, org, false);
    return unitRepository.save(unit);
  }

  public Unit obterUnidade(Long id) {
    return unitRepository
        .findById(id)
        .orElseThrow(() -> new IllegalArgumentException("Unidade não encontrada: " + id));
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
    return criarUsuarioComStatus(email, senhaPlain, role, org, unit, UserStatus.ACTIVE, null);
  }

  @Transactional
  public User criarUsuarioComStatus(
      String email,
      String senhaPlain,
      UserRole role,
      Organization org,
      Unit unit,
      UserStatus status,
      String phoneNumber) {

    User user =
        new User(
            "Usuário Teste",
            email,
            passwordEncoder.encode(senhaPlain),
            role,
            org,
            unit,
            "12345678901");

    if (phoneNumber != null && !phoneNumber.isBlank()) {
      user.updatePhoneNumber(phoneNumber);
    }

    if (status == UserStatus.ACTIVE) {
      user.activate();
    } else if (status == UserStatus.BLOCKED) {
      user.activate();
      user.block();
    } else if (status == UserStatus.INACTIVE) {
      user.activate();
      user.inactivate();
    }

    return userRepository.save(user);
  }

  public User criarUsuarioComTelefone(
      String email, String senhaPlain, UserRole role, Organization org, Unit unit, String phoneNumber) {
    return criarUsuarioComStatus(email, senhaPlain, role, org, unit, UserStatus.ACTIVE, phoneNumber);
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

  /**
   * Retorna o ID do primeiro usuário disponível na lista de candidatos (fallback para atribuição).
   */
  public Long resolverFallbackUsuarioId() {
    java.util.List<String> candidates =
        java.util.List.of(
            "operador@tech.com", "operador@acme.com", "admin@tech.com", "admin@acme.com");
    for (String email : candidates) {
      User user = obterUsuarioPorEmail(email);
      if (user != null) {
        return user.getId();
      }
    }
    throw new IllegalStateException(
        "Nenhum usuário disponível no cenário para operações de atribuição");
  }

  /** Busca usuário por email. Retorna null se não encontrado. */
  public User obterUsuarioPorEmail(String email) {
    return userRepository.findByEmail(email).orElse(null);
  }

  public User obterUsuarioPorEmailObrigatorio(String email) {
    return userRepository.findByEmail(email)
        .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado: " + email));
  }

  /** Obtém ID do usuário por email. Lança exceção se não encontrado. */
  public Long obterIdUsuarioPorEmail(String email) {
    return userRepository.findByEmail(email)
        .map(User::getId)
        .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado: " + email));
  }

  public String obterCodigoMfaValido(Long userId) {
    MfaCode code =
        mfaCodeRepository
            .findValidByUserId(userId, Instant.now())
            .orElseThrow(() -> new IllegalArgumentException("Código MFA não encontrado para usuário: " + userId));
    return code.getCode();
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
  public Asset criarAtivoComStatus(
      String assetTag, AssetType tipo, String modelo, Organization org, Unit unit, AssetStatus status) {
    Asset asset = new Asset(assetTag, tipo, modelo, org, unit);
    asset.changeStatus(status);
    return assetRepository.save(asset);
  }

  @Transactional
  public Asset criarAtivoComStatus(
      String assetTag, AssetType tipo, String modelo, Long organizationId, Long unitId, AssetStatus status) {
    Organization organization =
        organizationRepository
            .findById(organizationId)
            .orElseThrow(
                () ->
                    new IllegalArgumentException(
                        "Organização não encontrada: " + organizationId));
    Unit unit =
        unitRepository
            .findById(unitId)
            .orElseThrow(() -> new IllegalArgumentException("Unidade não encontrada: " + unitId));
    return criarAtivoComStatus(assetTag, tipo, modelo, organization, unit, status);
  }

  @Transactional
  public Asset criarAtivoComUsuarioAtribuido(
      String assetTag, AssetType tipo, String modelo, Long organizationId, Long unitId, String email) {
    Asset asset =
        criarAtivoComStatus(assetTag, tipo, modelo, organizationId, unitId, AssetStatus.AVAILABLE);
    User user = obterUsuarioPorEmailObrigatorio(email);
    asset.assignToUser(user);
    return assetRepository.save(asset);
  }

  @Transactional
  public Asset criarAtivoComQualquerUsuarioDaOrganizacao(
      String assetTag, AssetType tipo, String modelo, Long organizationId, Long unitId) {
    Asset asset =
        criarAtivoComStatus(assetTag, tipo, modelo, organizationId, unitId, AssetStatus.AVAILABLE);
    User user =
        userRepository.findAll().stream()
            .filter(u -> u.getOrganization() != null && u.getOrganization().getId().equals(organizationId))
            .findFirst()
            .orElseThrow(
                () ->
                    new IllegalArgumentException(
                        "Nenhum usuário encontrado para organização: " + organizationId));
    asset.assignToUser(user);
    return assetRepository.save(asset);
  }

  @Transactional
  public Unit criarUnidadePorOrganizacaoId(String nome, Long organizationId) {
    Organization organization =
        organizationRepository
            .findById(organizationId)
            .orElseThrow(
                () ->
                    new IllegalArgumentException(
                        "Organização não encontrada: " + organizationId));
    return criarUnidade(nome, organization);
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

  /** Cria ativo em transferência — para testar que IN_TRANSFER bloqueia novas manutenções. */
  @Transactional
  public Asset criarAtivoEmTransferencia(Organization org, Unit unit) {
    Asset asset = criarAtivo("ASSET-TRANSFER-001", AssetType.NOTEBOOK, org, unit);
    asset.changeStatus(AssetStatus.IN_TRANSFER);
    return assetRepository.save(asset);
  }

  // =========================================================
  // TESTES CONCORRENTES
  // =========================================================

  /**
   * Executa uma operação múltiplas vezes em paralelo para testar race conditions.
   *
   * <p>Usa ExecutorService para criar threads paralelas e CountDownLatch para sincronização.
   * Armazena o número de sucessos (respostas com status < 400) em context.sucessos.
   *
   * <p>IMPORTANTE: Este é um teste simplificado. Para testes concorrentes mais robustos,
   * considere usar frameworks como Gatling ou JMH.
   */
  public void testarConcorrencia(ConcurrentOperation operation) {
    int numThreads = 5; // Número de requisições paralelas
    ExecutorService executorService = Executors.newFixedThreadPool(numThreads);
    CountDownLatch latch = new CountDownLatch(numThreads);
    AtomicInteger sucessos = new AtomicInteger(0);

    try {
      // Submete numThreads operações para execução paralela
      for (int i = 0; i < numThreads; i++) {
        executorService.submit(() -> {
          try {
            // Executa a operação (ex: apiClient.atribuirAtivo(...))
            operation.execute();
            sucessos.incrementAndGet();
          } catch (Exception e) {
            // Operação falhou — esperado em testes de race condition
          } finally {
            latch.countDown();
          }
        });
      }

      // Aguarda que todas as threads terminem (máximo 10 segundos)
      if (!latch.await(10, TimeUnit.SECONDS)) {
        throw new RuntimeException("Teste de concorrência expirou após 10 segundos");
      }
    } catch (InterruptedException e) {
      Thread.currentThread().interrupt();
      throw new RuntimeException("Teste de concorrência foi interrompido", e);
    } finally {
      executorService.shutdown();
    }
  }

  /** Interface para operações concorrentes — permite passar lambdas ao testarConcorrencia. */
  @FunctionalInterface
  public interface ConcurrentOperation {
    Object execute() throws Exception;
  }
}
