# Banco de dados

O banco principal é PostgreSQL. Ele guarda os dados da aplicação e deve evoluir por migrações Flyway.

## Grupos de tabelas

### Organização e usuários

| Tabela | Uso |
|---|---|
| `organizations` | Organizações/tenants |
| `units` | Unidades de uma organização |
| `users` | Usuários, perfis e vínculo com organização/unidade |
| `user_consents` | Aceites e termos |
| `user_activation_tokens` | Ativação de conta |
| `mfa_codes` | MFA |
| `refresh_tokens` | Renovação de sessão |

### Gestão de ativos

| Tabela | Uso |
|---|---|
| `assets` | Cadastro principal dos ativos |
| `asset_assignment_history` | Histórico de responsáveis |
| `asset_status_history` | Histórico de status |
| `asset_categories` | Categorias de ativos |
| `asset_insurance` | Seguros |
| `cost_centers` | Centros de custo |

### Operações

| Tabela | Uso |
|---|---|
| `transfer_requests` | Transferências |
| `inventory_sessions` | Sessões de inventário |
| `inventory_items` | Itens conferidos no inventário |
| `maintenance_records` | Manutenções |

### Governança

| Tabela | Uso |
|---|---|
| `audit_events` | Eventos relevantes para rastreabilidade |

## Regras práticas

- Tabelas operacionais devem carregar referência de organização quando necessário.
- Relacionamentos devem proteger integridade com chaves estrangeiras.
- Campos usados em filtros frequentes precisam de índice.
- Dados sensíveis não devem aparecer em logs ou dumps compartilhados.
- Não altere schema direto no banco; crie migração.

## Migrações

Use Flyway para qualquer mudança estrutural:

- criar tabela;
- adicionar coluna;
- criar índice;
- alterar constraints;
- popular dados técnicos obrigatórios.

Boas práticas:

- Migração deve ser pequena e fácil de revisar.
- Evite operações irreversíveis sem backup.
- Para colunas obrigatórias em tabela existente, prefira criar nullable, preencher dados e só depois tornar obrigatória.
- Teste a aplicação subindo do zero com `docker compose up --build`.

## Concorrência

Quando várias pessoas ou processos podem alterar o mesmo ativo, proteja:

- transferências simultâneas;
- mudança de status durante inventário;
- baixa de ativo em manutenção;
- atualização concorrente de dados financeiros.

Use transações e validações no serviço, não apenas no frontend.

## Consultas importantes

Antes de criar endpoints de listagem, verifique:

- filtro por organização/unidade;
- paginação;
- ordenação previsível;
- índices para campos buscados;
- retorno sem dados sensíveis desnecessários.

