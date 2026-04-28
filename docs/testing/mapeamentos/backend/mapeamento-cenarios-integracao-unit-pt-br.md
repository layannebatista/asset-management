================================================================================
MAPEAMENTO DE CENÁRIOS DE TESTE — DOMÍNIO: TRANSFER (Camadas Integration / Unit)
Projeto: Patrimônio 360 | Backend Spring Boot
Atualizado em: 2026-04-16
================================================================================

LEGENDA
  Tipo        : UNITARIO, INTEGRACAO, SEGURANCA
  Criticidade : BLOCKER > CRITICAL > NORMAL > LOW
  Status      : AUTOMATIZADO | PENDENTE | NAO_APLICAVEL
  Camada      : indica o arquivo onde o teste vive

NOTAS GERAIS
  - Testes INTEGRACAO usam Spring MockMvc + H2 in-memory (profile test)
  - Testes UNITARIO usam JUnit 5 + Mockito, sem Spring context
  - Testes E2E (Cucumber BDD) continuam mapeados em mapeamento-cenarios-pt-br.md
  - Fluxo nominal de transferência: PENDING -> APPROVED -> COMPLETED
  - Fluxos alternativos: PENDING -> REJECTED ou PENDING -> CANCELLED
  - Solicitação move o ativo para IN_TRANSFER até a decisão final ou conclusão

================================================================================
SEÇÃO 1 — SOLICITAÇÃO  (integration/transfer/TransferRequestIntegrationTest)
================================================================================

ID    | Cenário                                                     | Tipo        | Criticidade | Status       | Camada / Arquivo
------|--------------------------------------------------------------|-------------|-------------|--------------|---------------------------------------------
TRI01 | ADMIN solicita transferência com sucesso                     | INTEGRACAO  | CRITICAL    | AUTOMATIZADO | integration/transfer/TransferRequestIntegrationTest
TRI02 | GESTOR solicita transferência com sucesso                    | INTEGRACAO  | CRITICAL    | AUTOMATIZADO | integration/transfer/TransferRequestIntegrationTest
TRI03 | OPERADOR não pode solicitar transferência                    | SEGURANCA   | CRITICAL    | AUTOMATIZADO | integration/transfer/TransferRequestIntegrationTest
TRI04 | Solicitação sem autenticação retorna 401                     | SEGURANCA   | CRITICAL    | AUTOMATIZADO | integration/transfer/TransferRequestIntegrationTest
TRI05 | Solicitação para a mesma unidade retorna 400                 | INTEGRACAO  | NORMAL      | AUTOMATIZADO | integration/transfer/TransferRequestIntegrationTest
TRI06 | Ativo inexistente retorna 404                                | INTEGRACAO  | NORMAL      | AUTOMATIZADO | integration/transfer/TransferRequestIntegrationTest
TRI07 | Unidade destino inexistente retorna 404                      | INTEGRACAO  | NORMAL      | AUTOMATIZADO | integration/transfer/TransferRequestIntegrationTest
TRI08 | Ativo com transferência ativa não aceita nova solicitação    | INTEGRACAO  | NORMAL      | AUTOMATIZADO | integration/transfer/TransferRequestIntegrationTest
TRI09 | Ativo em manutenção não pode ser transferido                 | INTEGRACAO  | NORMAL      | AUTOMATIZADO | integration/transfer/TransferRequestIntegrationTest

================================================================================
SEÇÃO 2 — FLUXO DE TRANSFERÊNCIA  (integration/transfer/TransferWorkflowIntegrationTest)
================================================================================

ID    | Cenário                                                     | Tipo        | Criticidade | Status       | Camada / Arquivo
------|--------------------------------------------------------------|-------------|-------------|--------------|---------------------------------------------
TWF01 | ADMIN aprova transferência pendente                          | INTEGRACAO  | CRITICAL    | AUTOMATIZADO | integration/transfer/TransferWorkflowIntegrationTest
TWF02 | ADMIN rejeita transferência e devolve ativo para AVAILABLE   | INTEGRACAO  | NORMAL      | AUTOMATIZADO | integration/transfer/TransferWorkflowIntegrationTest
TWF03 | Concluir transferência aprovada move ativo para unidade destino | INTEGRACAO | BLOCKER   | AUTOMATIZADO | integration/transfer/TransferWorkflowIntegrationTest
TWF04 | Concluir transferência sem aprovação retorna 400             | INTEGRACAO  | NORMAL      | AUTOMATIZADO | integration/transfer/TransferWorkflowIntegrationTest
TWF05 | Cancelar transferência pendente devolve ativo para AVAILABLE | INTEGRACAO  | NORMAL      | AUTOMATIZADO | integration/transfer/TransferWorkflowIntegrationTest
TWF06 | Aprovar transferência inexistente retorna 404                | INTEGRACAO  | NORMAL      | AUTOMATIZADO | integration/transfer/TransferWorkflowIntegrationTest
TWF07 | Cancelar transferência já aprovada retorna 400               | INTEGRACAO  | NORMAL      | AUTOMATIZADO | integration/transfer/TransferWorkflowIntegrationTest

================================================================================
SEÇÃO 3 — LISTAGEM E FILTROS  (integration/transfer/TransferQueryIntegrationTest)
================================================================================

ID    | Cenário                                                     | Tipo        | Criticidade | Status       | Camada / Arquivo
------|--------------------------------------------------------------|-------------|-------------|--------------|---------------------------------------------
TQI01 | Listar transferências com paginação retorna campos page      | INTEGRACAO  | NORMAL      | AUTOMATIZADO | integration/transfer/TransferQueryIntegrationTest
TQI02 | Filtrar transferências por status retorna itens esperados    | INTEGRACAO  | NORMAL      | AUTOMATIZADO | integration/transfer/TransferQueryIntegrationTest
TQI03 | Filtrar transferências por assetId retorna item correto      | INTEGRACAO  | NORMAL      | AUTOMATIZADO | integration/transfer/TransferQueryIntegrationTest
TQI04 | Filtrar transferências por unitId retorna itens da unidade   | INTEGRACAO  | NORMAL      | AUTOMATIZADO | integration/transfer/TransferQueryIntegrationTest
TQI05 | GESTOR vê apenas transferências da própria unidade           | SEGURANCA   | CRITICAL    | AUTOMATIZADO | integration/transfer/TransferQueryIntegrationTest

================================================================================
SEÇÃO 4 — CONTROLE DE ACESSO  (integration/transfer/TransferAccessIntegrationTest)
================================================================================

ID    | Cenário                                                     | Tipo        | Criticidade | Status       | Camada / Arquivo
------|--------------------------------------------------------------|-------------|-------------|--------------|---------------------------------------------
TAI01 | Listagem sem autenticação retorna 401                        | SEGURANCA   | CRITICAL    | AUTOMATIZADO | integration/transfer/TransferAccessIntegrationTest
TAI02 | Aprovação sem autenticação retorna 401                       | SEGURANCA   | CRITICAL    | AUTOMATIZADO | integration/transfer/TransferAccessIntegrationTest
TAI03 | OPERADOR não pode aprovar transferência                      | SEGURANCA   | CRITICAL    | AUTOMATIZADO | integration/transfer/TransferAccessIntegrationTest
TAI04 | GESTOR de outra unidade não pode aprovar transferência alheia | SEGURANCA | CRITICAL    | AUTOMATIZADO | integration/transfer/TransferAccessIntegrationTest

================================================================================
SEÇÃO 5 — TRANSFERSERVICE — SOLICITAÇÃO  (service/transfer/TransferRequestServiceTest)
================================================================================

ID   | Cenário                                                      | Tipo        | Criticidade | Status       | Camada / Arquivo
-----|---------------------------------------------------------------|-------------|-------------|--------------|---------------------------------------------
TS01 | Solicita transferência com sucesso e muda ativo para IN_TRANSFER | UNITARIO | CRITICAL    | AUTOMATIZADO | service/transfer/TransferRequestServiceTest
TS02 | Ativo sem unidade associada não pode ser transferido         | UNITARIO    | NORMAL      | AUTOMATIZADO | service/transfer/TransferRequestServiceTest
TS03 | Propaga falha quando já existe transferência ativa           | UNITARIO    | NORMAL      | AUTOMATIZADO | service/transfer/TransferRequestServiceTest

================================================================================
SEÇÃO 6 — TRANSFERSERVICE — DECISÃO  (service/transfer/TransferDecisionServiceTest)
================================================================================

ID   | Cenário                                                      | Tipo        | Criticidade | Status       | Camada / Arquivo
-----|---------------------------------------------------------------|-------------|-------------|--------------|---------------------------------------------
TS04 | Aprova transferência pendente com lock, save e audit         | UNITARIO    | CRITICAL    | AUTOMATIZADO | service/transfer/TransferDecisionServiceTest
TS05 | Rejeita transferência pendente e devolve ativo para AVAILABLE | UNITARIO   | NORMAL      | AUTOMATIZADO | service/transfer/TransferDecisionServiceTest
TS06 | GESTOR fora do escopo não pode aprovar transferência         | UNITARIO    | CRITICAL    | AUTOMATIZADO | service/transfer/TransferDecisionServiceTest
TS07 | Rejeitar transferência inexistente lança NotFoundException   | UNITARIO    | NORMAL      | AUTOMATIZADO | service/transfer/TransferDecisionServiceTest

================================================================================
SEÇÃO 7 — TRANSFERSERVICE — CONCLUSÃO E CANCELAMENTO  (service/transfer/TransferLifecycleServiceTest)
================================================================================

ID   | Cenário                                                      | Tipo        | Criticidade | Status       | Camada / Arquivo
-----|---------------------------------------------------------------|-------------|-------------|--------------|---------------------------------------------
TS08 | Conclui transferência aprovada e move ativo para unidade destino | UNITARIO | BLOCKER     | AUTOMATIZADO | service/transfer/TransferLifecycleServiceTest
TS09 | Cancela transferência pendente e devolve ativo para AVAILABLE | UNITARIO   | NORMAL      | AUTOMATIZADO | service/transfer/TransferLifecycleServiceTest
TS10 | OPERADOR sem atribuição não pode concluir transferência      | UNITARIO    | CRITICAL    | AUTOMATIZADO | service/transfer/TransferLifecycleServiceTest
TS11 | Cancelamento inválido propaga BusinessException              | UNITARIO    | NORMAL      | AUTOMATIZADO | service/transfer/TransferLifecycleServiceTest

================================================================================
SEÇÃO 8 — SERVIÇOS AUXILIARES  (service/transfer/TransferValidationServiceTest, TransferQueryServiceTest, TransferConcurrencyServiceTest)
================================================================================

ID   | Cenário                                                      | Tipo        | Criticidade | Status       | Camada / Arquivo
-----|---------------------------------------------------------------|-------------|-------------|--------------|---------------------------------------------
TS12 | requireAssetExists lança NotFoundException para asset nulo   | UNITARIO    | NORMAL      | AUTOMATIZADO | service/transfer/TransferValidationServiceTest
TS13 | validateOwnership lança ForbiddenException para outra organização | UNITARIO | CRITICAL   | AUTOMATIZADO | service/transfer/TransferValidationServiceTest
TS14 | validateAssetAvailableForTransfer bloqueia ativo indisponível | UNITARIO  | NORMAL      | AUTOMATIZADO | service/transfer/TransferValidationServiceTest
TS15 | validateTargetUnit bloqueia transferência para a mesma unidade | UNITARIO | NORMAL      | AUTOMATIZADO | service/transfer/TransferValidationServiceTest
TS16 | validateNoActiveTransfer bloqueia ativo com transferência ativa | UNITARIO | NORMAL      | AUTOMATIZADO | service/transfer/TransferValidationServiceTest
TS17 | ADMIN lista transferências com filtros e paginação           | UNITARIO    | NORMAL      | AUTOMATIZADO | service/transfer/TransferQueryServiceTest
TS18 | GESTOR usa escopo da própria unidade independentemente do filtro | UNITARIO | CRITICAL   | AUTOMATIZADO | service/transfer/TransferQueryServiceTest
TS19 | executeWithAssetLock aplica lock pessimista e executa operação | UNITARIO | CRITICAL    | AUTOMATIZADO | service/transfer/TransferConcurrencyServiceTest
TS20 | executeWithAssetLock falha quando assetId é nulo             | UNITARIO    | NORMAL      | AUTOMATIZADO | service/transfer/TransferConcurrencyServiceTest
TS21 | executeWithAssetLock lança NotFoundException para ativo inexistente | UNITARIO | NORMAL     | AUTOMATIZADO | service/transfer/TransferConcurrencyServiceTest

================================================================================
SEÇÃO 9 — ENTIDADE TRANSFERREQUEST — CONSTRUTOR  (unit/domain/transfer/TransferRequestConstructorTest)
================================================================================

ID   | Cenário                                                      | Tipo        | Criticidade | Status       | Camada / Arquivo
-----|---------------------------------------------------------------|-------------|-------------|--------------|---------------------------------------------
TT01 | Construtor inicia transferência como PENDING                 | UNITARIO    | CRITICAL    | AUTOMATIZADO | unit/domain/transfer/TransferRequestConstructorTest
TT02 | Construtor falha quando asset é nulo                         | UNITARIO    | NORMAL      | AUTOMATIZADO | unit/domain/transfer/TransferRequestConstructorTest
TT03 | Construtor falha quando reason é blank                       | UNITARIO    | NORMAL      | AUTOMATIZADO | unit/domain/transfer/TransferRequestConstructorTest
TT04 | Construtor falha para transferência na mesma unidade         | UNITARIO    | NORMAL      | AUTOMATIZADO | unit/domain/transfer/TransferRequestConstructorTest

================================================================================
SEÇÃO 10 — ENTIDADE TRANSFERREQUEST — DECISÃO  (unit/domain/transfer/TransferRequestDecisionTest)
================================================================================

ID   | Cenário                                                      | Tipo        | Criticidade | Status       | Camada / Arquivo
-----|---------------------------------------------------------------|-------------|-------------|--------------|---------------------------------------------
TT05 | Approve muda status para APPROVED                            | UNITARIO    | CRITICAL    | AUTOMATIZADO | unit/domain/transfer/TransferRequestDecisionTest
TT06 | Reject muda status para REJECTED                             | UNITARIO    | NORMAL      | AUTOMATIZADO | unit/domain/transfer/TransferRequestDecisionTest
TT07 | Approve falha fora do estado PENDING                         | UNITARIO    | NORMAL      | AUTOMATIZADO | unit/domain/transfer/TransferRequestDecisionTest
TT08 | Reject falha quando approver é nulo                          | UNITARIO    | NORMAL      | AUTOMATIZADO | unit/domain/transfer/TransferRequestDecisionTest

================================================================================
SEÇÃO 11 — ENTIDADE TRANSFERREQUEST — LIFECYCLE  (unit/domain/transfer/TransferRequestLifecycleTest)
================================================================================

ID   | Cenário                                                      | Tipo        | Criticidade | Status       | Camada / Arquivo
-----|---------------------------------------------------------------|-------------|-------------|--------------|---------------------------------------------
TT09 | Complete muda status para COMPLETED                          | UNITARIO    | BLOCKER     | AUTOMATIZADO | unit/domain/transfer/TransferRequestLifecycleTest
TT10 | Cancel muda status para CANCELLED quando PENDING             | UNITARIO    | NORMAL      | AUTOMATIZADO | unit/domain/transfer/TransferRequestLifecycleTest
TT11 | Complete falha fora do estado APPROVED                       | UNITARIO    | NORMAL      | AUTOMATIZADO | unit/domain/transfer/TransferRequestLifecycleTest
TT12 | Cancel falha fora do estado PENDING                          | UNITARIO    | NORMAL      | AUTOMATIZADO | unit/domain/transfer/TransferRequestLifecycleTest
TT13 | Helpers de estado refletem o status atual                    | UNITARIO    | NORMAL      | AUTOMATIZADO | unit/domain/transfer/TransferRequestLifecycleTest

================================================================================
RESUMO DE COBERTURA
================================================================================

Status                  Contagem  Porcentagem
────────────────────────────────────────────
✓ AUTOMATIZADO          46        100%
⊗ PENDENTE               0          0%
────────────────────────────────────────────
TOTAL                   46

Cobertura por Tipo:
  INTEGRACAO:  21 / 46 = 46%
  SEGURANCA:    9 / 46 = 20%
  UNITARIO:    25 / 46 = 54%

Reestruturação aplicada (2026-04-16):
  transfer.feature permanece como referência BDD/E2E do domínio
  integration/transfer  -> criado com TransferRequestIntegrationTest, TransferWorkflowIntegrationTest,
                           TransferQueryIntegrationTest e TransferAccessIntegrationTest
  service/transfer      -> criado com testes separados por responsabilidade do serviço
  unit/domain/transfer  -> criado com divisão da entidade TransferRequest por construção, decisão e lifecycle
================================================================================
