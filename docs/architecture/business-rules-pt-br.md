# Regras de Negócio

Documento revisado com base nas regras hoje refletidas pelos services, controllers e migrations do projeto.

---

# 1. Multi-Tenant

- cada organização representa um tenant
- o acesso entre tenants é proibido
- operações e consultas devem respeitar o escopo da organização do usuário autenticado

---

# 2. Usuários e Acesso

- usuário pertence a uma organização e a uma unidade da mesma organização
- papéis válidos: `ADMIN`, `GESTOR`, `OPERADOR`
- usuário nasce em `PENDING_ACTIVATION`
- senha é definida no fluxo de ativação
- usuários `BLOCKED` e `INACTIVE` não autenticam

Regras adicionais implementadas hoje:

- usuário com `phoneNumber` cadastrado entra em fluxo de MFA
- o MFA usa OTP de uso único e expiração curta
- refresh tokens são rotativos e podem ser revogados por logout

---

# 3. Ativação de Conta

- o token de ativação é de uso único
- tokens expirados ou já usados são rejeitados
- a ativação é pública porque o usuário ainda não possui credencial válida

---

# 4. Ativos

- `assetTag` é único
- o ativo pertence a uma organização e a uma unidade
- o ativo não é excluído fisicamente; é aposentado com `RETIRED`
- o status inicial é `AVAILABLE`

Status relevantes:

- `AVAILABLE`
- `ASSIGNED`
- `IN_TRANSFER`
- `IN_MAINTENANCE`
- `UNAVAILABLE`
- `RETIRED`

O ativo também pode receber dados:

- fiscais
- garantia
- depreciação
- centro de custo

---

# 5. Transferências

- origem e destino devem ser diferentes
- não pode haver mais de uma transferência ativa por ativo
- a abertura coloca o ativo em `IN_TRANSFER`
- aprovação antecede conclusão
- rejeição ou cancelamento devolvem o ativo ao estado operacional válido

---

# 6. Inventário

- só pode existir uma sessão ativa por unidade
- a sessão segue `OPEN -> IN_PROGRESS -> CLOSED` com alternativa `CANCELLED`
- `OPERADOR` pode consultar, mas não controla o ciclo da sessão

---

# 7. Manutenção

- a criação coloca o ativo imediatamente em `IN_MAINTENANCE`
- `description` é obrigatória na abertura
- `resolution` é obrigatória na conclusão
- `actualCost` pode ser informado na conclusão
- manutenção `COMPLETED` não pode ser cancelada

---

# 8. Financeiro, Seguro e Centro de Custo

- depreciação depende de dados financeiros válidos no ativo
- centros de custo são únicos por organização + código
- apólices de seguro pertencem ao ativo e à organização

---

# 9. Auditoria e Rastreabilidade

- operações críticas geram `audit_events`
- mudanças de status e atribuição de ativos também geram histórico dedicado
- registros de auditoria não devem ser alterados ou removidos

---

# 10. Autorização

- `ADMIN` governa organizações, usuários e operações sensíveis
- `GESTOR` executa gestão operacional ampla
- `OPERADOR` tem escopo operacional mais restrito
- as roles são reforçadas com validação de tenant e regras de negócio
