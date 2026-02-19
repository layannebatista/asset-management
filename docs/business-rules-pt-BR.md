# Regras de Negócio

Gerado em: 2026-02-18 02:21:42.348591

---

# 1. Visão Geral

Este documento define as regras de negócio centrais que regem o Sistema de Gestão de Ativos Enterprise.

Essas regras garantem integridade dos dados, segurança, auditabilidade e o gerenciamento adequado do ciclo de vida de todas as entidades.

Essas regras são aplicadas nas camadas de aplicação e de domínio.

---

# 2. Regras Multi-Tenant

O sistema é totalmente multi-tenant.

Regras:

- Cada organização representa um tenant
- Todos os dados pertencem exatamente a uma organização
- Todas as operações são restritas à organização do usuário
- O acesso entre tenants é estritamente proibido
- O isolamento de tenant deve ser aplicado em todas as consultas ao banco de dados e na lógica dos serviços

A violação do isolamento entre tenants é considerada uma falha crítica de segurança.

---

# 3. Regras de Organização

Regras:

- A organização deve possuir um identificador único
- A organização deve possuir um nome
- A organização pode estar ativa ou inativa
- Organizações inativas não podem executar operações

---

# 4. Regras de Unidade

Regras:

- A unidade deve pertencer exatamente a uma organização
- A unidade deve possuir um nome único dentro da organização
- A unidade pode estar ativa ou inativa
- Unidades não podem existir sem uma organização

---

# 5. Regras de Usuário

Regras:

- O usuário deve pertencer exatamente a uma organização
- O usuário deve pertencer exatamente a uma unidade
- O e-mail do usuário deve ser único dentro da organização
- O usuário deve possuir uma role válida
- O usuário pode estar ativo, inativo ou bloqueado
- Usuários inativos ou bloqueados não podem se autenticar
- As credenciais do usuário devem ser armazenadas de forma segura

---

# 6. Regras de Autenticação

Regras:

- A autenticação requer credenciais válidas
- Um token JWT deve ser emitido após autenticação bem-sucedida
- O token JWT deve incluir a identidade do usuário e seu escopo
- O token JWT deve expirar após o tempo configurado
- Todos os endpoints protegidos exigem um token JWT válido

---

# 7. Regras de Ativo

Regras:

- O ativo deve pertencer exatamente a uma organização
- O ativo deve pertencer exatamente a uma unidade
- O número do ativo deve ser único dentro da organização
- O número do ativo deve ser imutável após a criação
- O ativo não pode ser excluído permanentemente
- O ativo pode estar ativo ou inativo
- O ciclo de vida do ativo deve ser rastreado

A exclusão de ativos não é permitida para preservar o histórico de auditoria.

---

# 8. Regras de Transferência

Regras:

- A transferência deve referenciar um ativo válido
- A transferência deve especificar a unidade de origem e a unidade de destino
- A transferência deve ser aprovada antes da execução
- Apenas uma transferência ativa pode existir por ativo
- A transferência deve ser registrada nos logs de auditoria

As transferências garantem a rastreabilidade da movimentação dos ativos.

---

# 9. Regras de Inventário

Regras:

- O inventário deve pertencer a uma organização
- O inventário deve pertencer a uma unidade
- Apenas um ciclo de inventário ativo é permitido por unidade
- O inventário deve registrar a verificação dos ativos
- O inventário pode bloquear a movimentação de ativos

O inventário garante a precisão dos ativos.

---

# 10. Regras de Manutenção

Regras:

- A manutenção deve referenciar um ativo existente
- A manutenção deve registrar início e conclusão
- Ativos em manutenção podem ter operações restritas
- O histórico de manutenção deve ser preservado
- As operações de manutenção devem gerar logs de auditoria

A manutenção garante a integridade operacional dos ativos.

---

# 11. Regras de Auditoria

Regras:

- Todas as operações críticas devem gerar logs de auditoria
- Os logs de auditoria devem incluir:
  - Usuário
  - Timestamp
  - Operação
  - Entidade afetada
- Os logs de auditoria são imutáveis
- Os logs de auditoria não podem ser excluídos
- Os logs de auditoria garantem rastreabilidade completa

Os logs de auditoria são necessários para conformidade e monitoramento de segurança.

---

# 12. Regras de Autorização

Regras:

- O acesso deve ser restrito com base na role do usuário
- O acesso deve ser restrito com base na organização
- O acesso deve ser restrito com base no escopo
- O acesso não autorizado deve ser rejeitado

A autorização garante a segurança do sistema.

---

# 13. Regras de Integridade de Dados

Regras:

- Todos os relacionamentos de chave estrangeira devem ser válidos
- Todos os campos obrigatórios devem estar presentes
- Dados inválidos devem ser rejeitados
- As constraints de integridade do banco de dados devem ser aplicadas

---

# 14. Regras de Ciclo de Vida

Regras:

- As entidades devem seguir estados de ciclo de vida definidos
- As transições de estado devem ser controladas
- Transições inválidas devem ser impedidas

---

# 15. Resumo

Essas regras de negócio garantem:

- Isolamento multi-tenant
- Controle de acesso seguro
- Integridade dos dados
- Rastreabilidade completa
- Gerenciamento adequado do ciclo de vida

Essas regras são aplicadas em todo o sistema.
