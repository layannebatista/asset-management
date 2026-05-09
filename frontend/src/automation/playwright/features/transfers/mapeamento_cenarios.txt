================================================================================
MAPEAMENTO DE CENARIOS DE TESTE - DOMINIO: TRANSFERS (Frontend)
Projeto: Patrimonio 360 | Frontend Playwright + Cucumber
Atualizado em: 2026-04-16
================================================================================

LEGENDA
  Tipo        : E2E, SEGURANCA, USABILIDADE, RESILIENCIA, ACESSIBILIDADE
  Criticidade : BLOCKER > CRITICAL > NORMAL > LOW
  Status      : AUTOMATIZADO | PENDENTE | NAO_APLICAVEL
  Camada      : feature/steps do dominio

NOTAS GERAIS
  - Cobre criacao, aprovacao, rejeicao, cancelamento e conclusao.
  - Considera regras de visibilidade por perfil e comportamento do painel lateral.
  - Cenarios PENDENTE representam cobertura QA recomendada para frontend.
  - [CORRIGIDO] Filtro por status ja implementado em TransfersPage.tsx com 6 opcoes de status.
  - [CORRIGIDO] Rota /transfers agora protegida: acessivel apenas para ADMIN e GESTOR.

================================================================================
SECAO 1 - LISTAGEM, DETALHE E PAGINACAO
================================================================================

ID   | Cenario                                                     | Tipo          | Criticidade | Status       | Camada / Arquivo
-----|-------------------------------------------------------------|---------------|-------------|--------------|-------------------------------------------------------------
TR01 | Exibir tela de transferencias e botao Nova Solicitacao      | USABILIDADE   | NORMAL      | AUTOMATIZADO | transfers/transfer-management.feature
TR02 | Exibir lista lateral com codigo, status, origem e destino   | E2E           | NORMAL      | PENDENTE     | pages/transfers/TransfersPage.tsx
TR03 | Selecionar item na lista atualiza painel de detalhes        | E2E           | NORMAL      | PENDENTE     | pages/transfers/TransfersPage.tsx
TR04 | Detalhe exibe informacoes completas da transferencia        | E2E           | NORMAL      | AUTOMATIZADO | transfers/transfer-management.feature
TR05 | Estado vazio mostra "Selecione uma transferencia"          | USABILIDADE   | NORMAL      | PENDENTE     | pages/transfers/TransfersPage.tsx
TR06 | Estado de loading da lista exibido corretamente             | USABILIDADE   | LOW         | PENDENTE     | pages/transfers/TransfersPage.tsx
TR07 | Paginacao lateral avanca e retorna sem perder contexto      | E2E           | NORMAL      | PENDENTE     | pages/transfers/TransfersPage.tsx

================================================================================
SECAO 2 - CRIACAO DE TRANSFERENCIA
================================================================================

ID   | Cenario                                                     | Tipo          | Criticidade | Status       | Camada / Arquivo
-----|-------------------------------------------------------------|---------------|-------------|--------------|-------------------------------------------------------------
TC01 | Validar motivo minimo ao criar transferencia                | E2E           | NORMAL      | AUTOMATIZADO | transfers/transfer-management.feature
TC02 | Criar transferencia e cancelar em seguida                   | E2E           | CRITICAL    | AUTOMATIZADO | transfers/transfer-management.feature
TC03 | Criar transferencia e aprovar/concluir                      | E2E           | BLOCKER     | AUTOMATIZADO | transfers/transfer-management.feature
TC04 | Criar transferencia e rejeitar                              | E2E           | NORMAL      | AUTOMATIZADO | transfers/transfer-management.feature
TC05 | Bloquear submit sem ativo                                   | E2E           | NORMAL      | PENDENTE     | components/CreateTransferModal.tsx
TC06 | Bloquear submit sem unidade destino                         | E2E           | NORMAL      | PENDENTE     | components/CreateTransferModal.tsx
TC07 | Bloquear submit com motivo apenas espacos                   | E2E           | NORMAL      | PENDENTE     | components/CreateTransferModal.tsx
TC08 | Mostrar aviso quando nao ha unidade destino disponivel      | E2E           | NORMAL      | PENDENTE     | components/CreateTransferModal.tsx
TC09 | Trocar ativo reseta unidade destino no formulario           | USABILIDADE   | LOW         | PENDENTE     | components/CreateTransferModal.tsx
TC10 | Falha API na criacao exibe mensagem amigavel                | RESILIENCIA   | NORMAL      | PENDENTE     | pages/transfers/TransfersPage.tsx
TC11 | Ativo IN_MAINTENANCE aparece indisponivel no seletor de ativo| E2E          | CRITICAL    | PENDENTE     | components/CreateTransferModal.tsx
TC12 | Ativo RETIRED aparece indisponivel no seletor de ativo      | SEGURANCA     | CRITICAL    | PENDENTE     | components/CreateTransferModal.tsx
TC13 | Ativo ASSIGNED aparece desabilitado ou com aviso no seletor | E2E           | NORMAL      | PENDENTE     | components/CreateTransferModal.tsx

================================================================================
SECAO 3 - TRANSICOES DE STATUS E ACOES
================================================================================

ID   | Cenario                                                     | Tipo          | Criticidade | Status       | Camada / Arquivo
-----|-------------------------------------------------------------|---------------|-------------|--------------|-------------------------------------------------------------
TS01 | Acao "Aprovar Transferencia" visivel somente em PENDING    | E2E           | CRITICAL    | AUTOMATIZADO | transfers/transfer-management.feature
TS02 | Acao "Rejeitar" visivel somente em PENDING                 | E2E           | CRITICAL    | AUTOMATIZADO | transfers/transfer-management.feature
TS03 | Acao "Cancelar" visivel em PENDING                          | E2E           | NORMAL      | PENDENTE     | components/TransferDetail.tsx
TS04 | Acao "Confirmar Recebimento" visivel em APPROVED            | E2E           | CRITICAL    | AUTOMATIZADO | transfers/transfer-management.feature
TS05 | Mensagem visual para transferencia REJECTED                 | USABILIDADE   | LOW         | PENDENTE     | components/TransferDetail.tsx
TS06 | Mensagem visual para transferencia CANCELLED                | USABILIDADE   | LOW         | PENDENTE     | components/TransferDetail.tsx
TS07 | Timeline de progresso atualiza conforme status              | E2E           | NORMAL      | PENDENTE     | components/TransferDetail.tsx
TS08 | Falha API em aprovar/rejeitar/cancelar/concluir exibe erro | RESILIENCIA   | NORMAL      | PENDENTE     | pages/transfers/TransfersPage.tsx
TS09 | Duplo clique em Aprovar ou Rejeitar nao envia requisicao duas vezes | RESILIENCIA | CRITICAL | PENDENTE | components/TransferDetail.tsx
TS10 | Transferencia rejeitada exibe razao da rejeicao no painel   | USABILIDADE   | NORMAL      | PENDENTE     | components/TransferDetail.tsx

================================================================================
SECAO 4 - FILTROS E CONSULTA
================================================================================

ID   | Cenario                                                     | Tipo          | Criticidade | Status       | Camada / Arquivo
-----|-------------------------------------------------------------|---------------|-------------|--------------|-------------------------------------------------------------
TF01 | Filtrar transferencias por status Pendente                  | E2E           | NORMAL      | AUTOMATIZADO | pages/transfers/TransfersPage.tsx
TF02 | Filtrar por status Aprovado                                 | E2E           | NORMAL      | PENDENTE     | pages/transfers/TransfersPage.tsx
TF03 | Filtrar por status Rejeitado                                | E2E           | NORMAL      | PENDENTE     | pages/transfers/TransfersPage.tsx
TF04 | Filtrar por status Cancelado                                | E2E           | NORMAL      | PENDENTE     | pages/transfers/TransfersPage.tsx
TF05 | Filtrar por status Concluido                                | E2E           | NORMAL      | PENDENTE     | pages/transfers/TransfersPage.tsx
TF06 | Limpar filtro de status retorna lista completa de transferencias | USABILIDADE | NORMAL   | PENDENTE     | pages/transfers/TransfersPage.tsx

================================================================================
SECAO 5 - CONTROLE DE ACESSO E SEGURANCA
================================================================================

ID   | Cenario                                                     | Tipo          | Criticidade | Status       | Camada / Arquivo
-----|-------------------------------------------------------------|---------------|-------------|--------------|-------------------------------------------------------------
AX01 | ADMIN pode aprovar/rejeitar transferencias                  | SEGURANCA     | CRITICAL    | AUTOMATIZADO | transfers/transfer-management.feature
AX02 | GESTOR pode aprovar/rejeitar transferencias                 | SEGURANCA     | CRITICAL    | AUTOMATIZADO | transfers/transfer-management.feature
AX03 | OPERADOR nao acessa rota /transfers                         | SEGURANCA     | BLOCKER     | AUTOMATIZADO | routes/AppRoutes.tsx
AX04 | Escopo de GESTOR limita dados por unitId                    | SEGURANCA     | CRITICAL    | AUTOMATIZADO | transfers/transfer-management.feature
AX05 | Usuario sem sessao redireciona para login                   | SEGURANCA     | BLOCKER     | AUTOMATIZADO | transfers/transfer-management.feature

================================================================================
SECAO 6 - ACESSIBILIDADE
================================================================================

ID   | Cenario                                                     | Tipo          | Criticidade | Status       | Camada / Arquivo
-----|-------------------------------------------------------------|---------------|-------------|--------------|-------------------------------------------------------------
AA01 | Modal de criacao possui labels e foco inicial               | ACESSIBILIDADE| NORMAL      | PENDENTE     | components/CreateTransferModal.tsx
AA02 | Botoes de acao possuem rotulo claro                         | ACESSIBILIDADE| NORMAL      | PENDENTE     | components/TransferDetail.tsx
AA03 | Navegacao por teclado funciona na lista lateral             | ACESSIBILIDADE| NORMAL      | PENDENTE     | pages/transfers/TransfersPage.tsx

================================================================================
RESUMO DE COBERTURA
================================================================================

Status                  Contagem  Porcentagem
---------------------------------------------
AUTOMATIZADO            19        45%
PENDENTE                23        55%
NAO_APLICAVEL           0         0%
---------------------------------------------
TOTAL                   42

Novos cenarios adicionados (2026-04-21): TC11-TC13, TS09, TS10, TF06
Cenarios de estado de ativos no seletor, double-click e limpeza de filtro nao estavam mapeados.

Arquivos de referencia do dominio:
  - features/transfers/transfer-management.feature
  - step-definitions/transfers/transfer-management.steps.ts
================================================================================
