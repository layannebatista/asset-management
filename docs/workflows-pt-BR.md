# Fluxos de Trabalho

---

# 1. Visão Geral

Este documento descreve os fluxos operacionais do Sistema de Gestão de Ativos Enterprise.

Os fluxos de trabalho definem como as entidades percorrem seu ciclo de vida e como as operações do sistema são executadas.

Os fluxos garantem:

- Integridade dos dados
- Rastreabilidade
- Operações controladas
- Auditabilidade

---

# 2. Fluxo do Ciclo de Vida do Ativo

O ativo possui 6 status possíveis que refletem seu estado real a cada momento.

```
AVAILABLE ──────────────────────────────────────────┐
    │                                               │
    ├─→ ASSIGNED ────────────────────────────────→──┤  (atribuição/remoção)
    │       │                                       │
    ├─→ IN_TRANSFER ──────────────────────────────→─┤  (transferência)
    │                                               │
    ├─→ IN_MAINTENANCE ─→ AVAILABLE ou ASSIGNED     │  (manutenção)
    │                                               │
    └─→ RETIRED  (estado final — qualquer status)   │
                                                    │
UNAVAILABLE (estado administrativo)                 │
```

---

## Fluxo de Criação de Ativo

Etapas:

1. Usuário (`ADMIN` ou `GESTOR`) envia solicitação de criação de ativo
2. Sistema valida os dados de entrada (`assetTag`, `type`, `model`)
3. Sistema valida unicidade do `assetTag`
4. Sistema valida que a unidade pertence à organização
5. Registro do ativo é criado com status `AVAILABLE`
6. Log de auditoria é gerado

Variante com assetTag automático:

- O sistema gera o `assetTag` automaticamente antes de salvar
- Em caso de colisão (race condition), uma exceção de negócio é retornada

---

## Fluxo de Atribuição de Ativo

Etapas:

1. Usuário (`ADMIN` ou `GESTOR`) solicita atribuição do ativo a um usuário
2. Sistema valida que o ativo existe e pertence à organização
3. Sistema valida que o usuário existe
4. Ativo passa para status `ASSIGNED` e é vinculado ao usuário
5. Histórico de atribuição é registrado em `asset_assignment_history`

---

## Fluxo de Desativação (Aposentadoria) de Ativo

Etapas:

1. Usuário (`ADMIN`) solicita aposentadoria do ativo
2. Sistema valida que o ativo não está já `RETIRED`
3. Vínculo com usuário é removido
4. Status do ativo é atualizado para `RETIRED`
5. Log de auditoria é gerado

Ativos não são excluídos fisicamente — o status `RETIRED` é o estado final permanente.

---

# 3. Fluxo de Transferência

O fluxo de transferência rastreia a movimentação de ativos entre unidades com aprovação obrigatória.

```
PENDING → APPROVED → COMPLETED
        ↘ REJECTED  (ativo volta para AVAILABLE/ASSIGNED)
```

---

## Etapas do Fluxo de Transferência

**Solicitação:**

1. Usuário (`ADMIN` ou `GESTOR`) cria solicitação de transferência informando o ativo, a unidade destino e o motivo
2. Sistema valida que o ativo existe e pertence à organização
3. Sistema valida que não há transferência ativa para o ativo
4. Sistema valida que unidade de origem e destino são diferentes
5. Ativo é imediatamente movido para `IN_TRANSFER`
6. Registro da transferência é criado com status `PENDING`

**Aprovação:**

7. Usuário autorizado (`ADMIN` ou `GESTOR`) aprova a transferência
8. Transferência passa para `APPROVED`

**Rejeição (alternativa):**

7. Usuário autorizado rejeita a transferência
8. Ativo retorna para `AVAILABLE`
9. Transferência passa para `REJECTED`

**Conclusão:**

9. Usuário executa a conclusão da transferência
10. Unidade do ativo é atualizada para a unidade destino
11. Status do ativo volta para `AVAILABLE`
12. Transferência passa para `COMPLETED`
13. Log de auditoria é gerado

---

# 4. Fluxo de Inventário

O fluxo de inventário verifica a presença física dos ativos em uma unidade.

```
OPEN → IN_PROGRESS → CLOSED
     ↘                ↗
      CANCELLED (de OPEN ou IN_PROGRESS)
```

---

## Etapas do Fluxo de Inventário

1. Usuário inicia ciclo de inventário para uma unidade
2. Sistema valida que não há sessão ativa (`OPEN` ou `IN_PROGRESS`) para a unidade
3. Sistema valida que o usuário e a unidade pertencem à mesma organização
4. Sessão de inventário é criada com status `OPEN`
5. Usuário inicia a sessão — status muda para `IN_PROGRESS`
6. Ativos são verificados e registrados como presentes ou ausentes em `inventory_items`
7. Usuário conclui o inventário — status muda para `CLOSED` com registro do `closed_at`
8. Log de auditoria é gerado

O inventário garante precisão dos ativos.

---

# 5. Fluxo de Manutenção

O fluxo de manutenção rastreia o ciclo completo de uma operação de manutenção de ativo.

```
REQUESTED → IN_PROGRESS → COMPLETED
          ↘              ↗
           CANCELLED (não pode cancelar COMPLETED)
```

---

## Etapas do Fluxo de Manutenção

**Criação:**

1. Usuário (`ADMIN` ou `GESTOR`) cria solicitação de manutenção informando o ativo e a descrição do problema
2. Sistema valida que o ativo existe e pertence à organização
3. **Ativo é imediatamente movido para `IN_MAINTENANCE`** (bloqueio ocorre na criação, não no início)
4. Registro de manutenção é criado com status `REQUESTED`
5. Log de auditoria é gerado

**Início:**

5. Usuário (`ADMIN`, `GESTOR` ou `OPERADOR`) inicia a manutenção
6. Manutenção passa para `IN_PROGRESS` com registro de `started_at` e `started_by_user_id`

**Conclusão:**

7. Usuário (`ADMIN`, `GESTOR` ou `OPERADOR`) conclui a manutenção informando a resolução
8. Manutenção passa para `COMPLETED` com registro de `completed_at` e `completed_by_user_id`
9. Ativo retorna para `ASSIGNED` (se havia usuário atribuído) ou `AVAILABLE`
10. Log de auditoria é gerado

**Cancelamento (alternativa):**

- Usuário (`ADMIN` ou `GESTOR`) cancela a manutenção em status `REQUESTED` ou `IN_PROGRESS`
- Manutenção passa para `CANCELLED`
- Ativo retorna para `ASSIGNED` ou `AVAILABLE`
- Manutenção `COMPLETED` **não pode ser cancelada**

---

# 6. Fluxo de Autenticação

Etapas:

1. Usuário envia e-mail e senha para `POST /auth/login`
2. Sistema valida credenciais
3. Sistema verifica que o usuário está com status `ACTIVE`
4. Token JWT é gerado com identidade, role e organização do usuário
5. Token retornado ao cliente com tempo de expiração

---

# 7. Fluxo de Ativação de Conta

Etapas:

1. ADMIN cria o usuário via `POST /users`
2. Sistema cria o usuário com status `PENDING_ACTIVATION` e sem senha
3. Sistema gera token de ativação com prazo de expiração
4. Token é enviado ao usuário (mecanismo externo)
5. Usuário acessa `POST /users/activation/activate` com o token e define sua senha
6. Sistema valida o token (não expirado, não usado)
7. Senha é definida via hash BCrypt
8. Status do usuário muda para `ACTIVE`
9. Token é marcado como usado

---

# 8. Fluxo de Autorização

Etapas:

1. Usuário envia requisição com token JWT no header `Authorization: Bearer <token>`
2. Filtro JWT valida assinatura e expiração do token
3. Identidade e role do usuário são extraídas do token
4. Role do usuário é verificada para o endpoint solicitado (`@PreAuthorize`)
5. Escopo do tenant é validado (dados filtrados por `organization_id`)
6. Requisição autorizada ou negada com `403 Forbidden`

---

# 9. Fluxo de Registro de Auditoria

Etapas:

1. Operação crítica é realizada em qualquer módulo
2. `AuditService` é invocado com tipo de evento, usuário, organização, unidade e entidade afetada
3. Registro de auditoria é criado e persistido em `audit_events`

Logs de auditoria são imutáveis e não podem ser excluídos.

---

# 10. Fluxo de Tratamento de Erros

Etapas:

1. Requisição inválida recebida
2. Validação realizada (Bean Validation ou lógica de domínio)
3. Exceção lançada (`BusinessException`, `NotFoundException`, `ForbiddenException`, etc.)
4. `GlobalExceptionHandler` intercepta e formata a resposta de erro padronizada
5. Resposta de erro retornada com código HTTP apropriado

---

# 11. Aplicação do Isolamento Multi-Tenant nos Fluxos

O isolamento multi-tenant é aplicado em todos os fluxos.

Etapas:

1. Usuário autenticado — organização extraída do JWT
2. Escopo da organização identificado em todas as consultas
3. Dados filtrados automaticamente por `organization_id`
4. Operação executada dentro do escopo do tenant
5. Tentativas de acesso a dados de outro tenant resultam em `403 Forbidden`

---

# 12. Resumo

Estes fluxos garantem:

- Ciclo de vida de ativos controlado com 6 status bem definidos
- Operações de transferência com aprovação obrigatória e rastreabilidade completa
- Rastreamento preciso de inventário por unidade
- Rastreabilidade de manutenção com bloqueio imediato do ativo
- Ativação segura de contas via token com prazo de expiração
- Autenticação e autorização seguras via JWT e RBAC
- Auditabilidade completa de todas as operações críticas