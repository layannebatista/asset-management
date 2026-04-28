# Categorização de Testes no Allure

## Objetivo

Documentar como os testes estão categorizados no Allure Reports para facilitar visualização, navegação e análise dos resultados.

## Estrutura de Agrupamento

A hierarquia de agrupamento é simples e intuitiva:

```
Tipo de Teste
└── Módulo
    └── Caso de Teste
```

## Os 3 Tipos de Teste

| Tipo | Localização | Tag JUnit5 | Tag Cucumber | Descrição |
|------|-------------|-----------|------------|-----------|
| **E2E** | `features/**/*.feature` | - | `@allure.label.testType:E2E` | Testes de aceitação via Cucumber (BDD) - validam fluxos completos |
| **Unit** | `unit/**/*Test.java` | `@Tag("testType=Unit")` | - | Testes unitários de domínio - validam comportamento isolado |
| **Integration** | `integration/**/*Test.java`, `service/**/*Test.java` | `@Tag("testType=Integration")` | - | Testes de integração e serviço - validam API e lógica com dependências |

## Módulos Suportados

Os testes são organizados por módulo usando tags:
- Cucumber: `@allure.label.module:NomeDoModulo`
- JUnit5: `@Tag("module=NomeDoModulo")`

Módulos atuais:
- Asset
- Auth
- Transfer
- Maintenance
- Organization
- User
- Category
- Unit
- Audit
- Dashboard
- Depreciation
- Export
- Insurance
- Inventory

## Exemplos de Categorização

### Testes BDD/E2E (Cucumber)

```gherkin
@allure.label.testType:E2E
@allure.label.module:Asset
@allure.label.parentSuite:Backend
@allure.label.epic:Gestao_de_Ativos
Funcionalidade: Gerenciamento do Ciclo de Vida de Ativos
```

Aplicado em 16 feature files:
- `asset.feature`, `auth.feature`, `maintenance.feature`, `transfer.feature`
- `organization.feature`, `user.feature`, `category.feature`, `unit.feature`
- `audit.feature`, `dashboard.feature`, `depreciation.feature`, `export.feature`
- `insurance.feature`, `inventory.feature`

### Testes Unitários (JUnit5)

```java
@Tag("testType=Unit")
@Tag("module=Asset")
@Epic("Backend")
@Feature("Domínio — Asset")
class AssetConstructorTest { }
```

Exemplos:
- `AssetConstructorTest`
- `AssetStatusTest`
- `AssetRetireTest`
- `MaintenanceRecordTest`
- `TransferRequestTest`

### Testes de Integração (JUnit5)

```java
@Tag("testType=Integration")
@Tag("module=Asset")
@Epic("Backend")
@Feature("Integração — Assets")
class AssetIntegrationTest extends BaseIntegrationTest { }
```

Exemplos:
- `AssetIntegrationTest`
- `AssetCreateIntegrationTest`
- `AuthLoginIntegrationTest`
- `TransferWorkflowIntegrationTest`

### Testes de Serviço (JUnit5)

```java
@Tag("testType=Integration")
@Tag("module=Asset")
@ExtendWith(MockitoExtension.class)
class AssetCreateServiceTest { }
```

Exemplos:
- `AssetCreateServiceTest`
- `AssetSearchServiceTest`
- `AuthAuthenticateServiceTest`
- `TransferRequestServiceTest`

## Visualização no Allure

Ao abrir o Allure Reports após executar os testes, você verá:

1. **Dashboard Principal**
   - Contadores separados por tipo (E2E, Unit, Integration)
   - Total de testes executados

2. **Seção Categories**
   - E2E (testes BDD Cucumber)
   - Unit (testes unitários de domínio)
   - Integration (testes de integração e serviço)

3. **Dentro de cada categoria**
   - Testes agrupados por módulo (Asset, Auth, Transfer, etc.)
   - Cada módulo mostra seus casos/cenários específicos

## Proporção Típica de Testes

```
Total: ~346 testes
├── E2E (Cucumber):     ~197 testes (57%)
├── Integration:         ~70 testes (20%)
├── Service:            ~60 testes (17%)
└── Unit:               ~15 testes (6%)
```

## Como Adicionar Tags em Novos Testes

### Para Feature Files Novos

Sempre adicione no início do arquivo:

```gherkin
@allure.label.testType:E2E
@allure.label.module:NomeDoModulo
@allure.label.parentSuite:Backend
@allure.label.epic:SuaEpic
Funcionalidade: Descrição
```

### Para Classes de Teste Java Novas

Sempre adicione na classe:

```java
@Tag("testType=Unit")  // ou Integration
@Tag("module=Asset")    // seu módulo
@Epic("Backend")
@Feature("Sua Feature")
class MinhaTesteClass { }
```

## Referências

- Documentação de testes: [testing-pt-br.md](./testing-pt-br.md)
- Padrão de documentação: [padrao-documentacao-pt-br.md](../governance/padrao-documentacao-pt-br.md)
