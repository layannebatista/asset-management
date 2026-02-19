# Esquema do Banco de Dados

Gerado em: 2026-02-18 02:26:46.026668

---

# 1. Visão Geral

Este documento descreve o esquema de banco de dados utilizado pelo Sistema de Gestão de Ativos Enterprise.

O banco de dados utiliza PostgreSQL e segue um modelo relacional.

O esquema suporta:

- Isolamento multi-tenant
- Gerenciamento do ciclo de vida de ativos
- Transferências
- Gestão de inventário
- Acompanhamento de manutenção
- Registro de auditoria

A integridade do banco de dados é aplicada utilizando chaves estrangeiras e constraints.

---

# 2. Tabelas Principais

## organizations

Representa os tenants.

Campos:

- id (chave primária)
- name
- status
- created_at
- updated_at

Cada organização é um tenant.

---

## units

Representa unidades organizacionais.

Campos:

- id (chave primária)
- organization_id (chave estrangeira)
- name
- status
- created_at
- updated_at

Cada unidade pertence a uma organização.

---

## users

Representa usuários do sistema.

Campos:

- id (chave primária)
- organization_id (chave estrangeira)
- unit_id (chave estrangeira)
- email
- password_hash
- role
- status
- created_at
- updated_at

Cada usuário pertence a uma organização e a uma unidade.

---

## assets

Representa ativos gerenciados.

Campos:

- id (chave primária)
- organization_id (chave estrangeira)
- unit_id (chave estrangeira)
- asset_number
- name
- description
- status
- created_at
- updated_at

Os números dos ativos são únicos e imutáveis.

---

## transfers

Representa transferências de ativos.

Campos:

- id (chave primária)
- asset_id (chave estrangeira)
- source_unit_id
- destination_unit_id
- status
- created_at
- completed_at

Registra o histórico de movimentação dos ativos.

---

## inventory_cycles

Representa processos de inventário.

Campos:

- id (chave primária)
- organization_id (chave estrangeira)
- unit_id (chave estrangeira)
- status
- started_at
- completed_at

Registra ciclos de verificação de inventário.

---

## maintenance_requests

Representa operações de manutenção.

Campos:

- id (chave primária)
- asset_id (chave estrangeira)
- status
- requested_at
- completed_at

Registra o ciclo de vida da manutenção de ativos.

---

## audit_logs

Representa registros de auditoria.

Campos:

- id (chave primária)
- organization_id (chave estrangeira)
- user_id (chave estrangeira)
- entity_type
- entity_id
- operation
- timestamp

Fornece trilha completa de auditoria.

---

# 3. Relacionamentos

Relacionamentos:

organization → units

organization → users

organization → assets

units → users

units → assets

assets → transfers

assets → maintenance_requests

organization → audit_logs

users → audit_logs

---

# 4. Design Multi-Tenant

O isolamento multi-tenant é aplicado utilizando:

campo organization_id nas tabelas.

Todas as consultas devem filtrar por organization_id.

Isso impede acesso a dados entre tenants.

---

# 5. Constraints

As constraints do banco de dados incluem:

- Constraints de chave primária
- Constraints de chave estrangeira
- Constraints de unicidade em asset_number
- Constraints NOT NULL
- Constraints de integridade referencial

Essas garantem a integridade dos dados.

---

# 6. Estratégia de Indexação

Os índices são utilizados para:

- Chaves primárias
- Chaves estrangeiras
- asset_number
- organization_id
- Campos frequentemente consultados

Os índices melhoram o desempenho.

---

# 7. Estratégia de Migração

As migrações do banco de dados são gerenciadas utilizando Flyway.

Arquivos de migração localizados em:

db/migration/

A migração garante consistência do esquema entre ambientes.

---

# 8. Auditoria e Rastreabilidade

Os logs de auditoria fornecem:

- Histórico de operações
- Rastreamento de atividades de usuários
- Monitoramento de segurança

Os logs de auditoria são imutáveis.

---

# 9. Considerações de Segurança

O acesso ao banco de dados deve ser restrito.

Requisitos:

- Autenticação forte
- Acesso restrito
- Credenciais seguras

Dados sensíveis devem ser protegidos.

---

# 10. Resumo

O esquema de banco de dados garante:

- Isolamento multi-tenant
- Integridade dos dados
- Rastreabilidade
- Escalabilidade
- Confiabilidade nível enterprise
