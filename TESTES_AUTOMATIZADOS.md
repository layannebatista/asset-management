# Inventário de Testes Automatizados

> Gerado em: 2026-04-12 · Cobertura baseada em leitura direta do código-fonte

**Legenda de tipo** — `🔵 e2e` · `🟡 integração` · `🟢 unitário`
**Legenda de status** — `✅ existente` · `⬜ ausente`
**Legenda de criticidade** — `🔴 Crítico` autenticação / segurança / controle de acesso · `🟠 Alto` fluxos principais / validações de negócio · `🟡 Médio` filtros / listagens / estados de UI · `🟢 Baixo` edge cases / cosmético / hooks

---

## Resumo Geral

| Módulo | ✅ | ⬜ | Total |
|---|---|---|---------|---------|
| Autenticação | 18 | 18 | 36 |
| Ativação de Conta | 0 | 12 | 12 |
| Ativos | 33 | 61 | 94 |
| Histórico de Ativos | 0 | 8 | 8 |
| Manutenção | 39 | 30 | 69 |
| Transferências | 30 | 24 | 54 |
| Depreciação | 7 | 9 | 16 |
| Seguro | 0 | 13 | 13 |
| Usuários | 0 | 38 | 38 |
| Organizações | 0 | 14 | 14 |
| Unidades | 0 | 12 | 12 |
| Categorias | 0 | 13 | 13 |
| Centro de Custo | 0 | 6 | 6 |
| Inventário | 0 | 19 | 19 |
| Auditoria | 0 | 15 | 15 |
| Dashboard | 0 | 11 | 11 |
| Exportação | 1 | 9 | 10 |
| AI Insights | 0 | 18 | 18 |
| Arquitetura (ArchUnit) | 9 | 0 | 9 |
| **Frontend — Páginas** | 36 | 94 | 130 |
| **Frontend — Hooks/APIs** | 0 | 22 | 22 |
| **TOTAL** | **173** | **446** | **619** |

---

## 1 · Autenticação

`✅ 18 existentes · ⬜ 18 ausentes`

| Cenário | Arquivo | Tipo | Status | Criticidade |
|---------|---------|------|---------|---------|
| POST /auth/login com credenciais válidas sem MFA — retorna 200 com tokens | `AuthController.java` | 🟡 integração | ✅ | 🔴 Crítico |
| POST /auth/login com telefone configurado — retorna mfaRequired=true | `AuthController.java` | 🟡 integração | ⬜ | 🔴 Crítico |
| POST /auth/login com email inválido (formato) — retorna 400 | `features/auth/auth.feature` | 🟡 integração | ✅ | 🔴 Crítico |
| POST /auth/login com email em branco — retorna 400 | `features/auth/auth.feature` | 🟡 integração | ✅ | 🔴 Crítico |
| POST /auth/login com senha incorreta — retorna 401 | `AuthController.java` | 🟡 integração | ✅ | 🔴 Crítico |
| POST /auth/login com senha em branco — retorna 400 | `features/auth/auth.feature` | 🟡 integração | ✅ | 🔴 Crítico |
| POST /auth/login com usuário inexistente — retorna 401 | `AuthController.java` | 🟡 integração | ✅ | 🔴 Crítico |
| POST /auth/mfa/verify com código MFA válido — retorna 200 com tokens | `AuthController.java` | 🟡 integração | ⬜ | 🔴 Crítico |
| POST /auth/mfa/verify com código MFA inválido — retorna 401 | `AuthController.java` | 🟡 integração | ⬜ | 🔴 Crítico |
| POST /auth/mfa/verify com código MFA expirado — retorna 401 | `AuthController.java` | 🟡 integração | ⬜ | 🔴 Crítico |
| POST /auth/mfa/verify com 5 dígitos (abaixo do mínimo) — retorna 400 | `AuthController.java` | 🟡 integração | ⬜ | 🔴 Crítico |
| POST /auth/mfa/verify com 7 dígitos (acima do máximo) — retorna 400 | `AuthController.java` | 🟡 integração | ⬜ | 🔴 Crítico |
| POST /auth/mfa/verify código já utilizado não pode ser reutilizado — retorna 401 | `AuthController.java` | 🟡 integração | ⬜ | 🔴 Crítico |
| POST /auth/refresh com refreshToken válido — retorna 200 com novos tokens | `AuthController.java` | 🟡 integração | ✅ | 🔴 Crítico |
| POST /auth/refresh com refreshToken inválido — retorna 400 | `features/auth/auth.feature` | 🟡 integração | ✅ | 🔴 Crítico |
| POST /auth/refresh com refreshToken expirado — retorna 400 | `AuthController.java` | 🟡 integração | ⬜ | 🔴 Crítico |
| POST /auth/refresh com refreshToken revogado após logout — retorna 400 | `AuthController.java` | 🟡 integração | ⬜ | 🔴 Crítico |
| POST /auth/refresh sem enviar refreshToken — retorna 400 | `features/auth/auth.feature` | 🟡 integração | ✅ | 🔴 Crítico |
| POST /auth/refresh — token retornado é diferente do anterior | `AuthController.java` | 🟡 integração | ⬜ | 🔴 Crítico |
| POST /auth/logout com token válido — revoga todos os refreshTokens | `AuthController.java` | 🟡 integração | ✅ | 🔴 Crítico |
| POST /auth/logout sem autenticação — retorna 401 | `features/auth/auth.feature` | 🟡 integração | ✅ | 🔴 Crítico |
| POST /auth/logout — não é possível usar refreshToken após logout | `AuthController.java` | 🟡 integração | ⬜ | 🔴 Crítico |
| POST /auth/login com email contendo apenas espaços — retorna 400 | `AuthController.java` | 🟡 integração | ⬜ | 🔴 Crítico |
| POST /auth/login com senha contendo apenas espaços — retorna 400 | `AuthController.java` | 🟡 integração | ⬜ | 🔴 Crítico |
| POST /auth/refresh com accessToken no lugar do refreshToken — retorna 400 | `AuthController.java` | 🟡 integração | ⬜ | 🔴 Crítico |
| GET /assets sem autenticação — retorna 401 | `features/auth/auth.feature` | 🟡 integração | ✅ | 🔴 Crítico |
| GET /assets/{id} sem autenticação — retorna 401 | `AuthE2ETest.java` | 🟡 integração | ✅ | 🔴 Crítico |
| Token inválido em qualquer endpoint — retorna 401 | `AuthE2ETest.java` | 🟡 integração | ✅ | 🔴 Crítico |
| ADMIN acessa GET /assets com token válido — retorna 200 | `AuthE2ETest.java` | 🟡 integração | ✅ | 🔴 Crítico |
| GESTOR acessa GET /assets com token válido — retorna 200 | `AuthE2ETest.java` | 🟡 integração | ✅ | 🔴 Crítico |
| OPERADOR acessa GET /assets com token válido — retorna 200 | `AuthE2ETest.java` | 🟡 integração | ✅ | 🔴 Crítico |
| Página de login exibe formulário com email e senha | `login.feature` | 🔵 e2e | ✅ | 🔴 Crítico |
| Página de login exibe perfis de demonstração | `login.feature` | 🔵 e2e | ✅ | 🔴 Crítico |
| Clicar em perfil ADMIN preenche credenciais | `login.feature` | 🔵 e2e | ✅ | 🟢 Baixo |
| Login com credenciais inválidas exibe mensagem de erro | `login.feature` | 🔵 e2e | ✅ | 🔴 Crítico |
| Login com ADMIN redireciona para /dashboard | `login.feature` | 🔵 e2e | ✅ | 🔴 Crítico |

---

## 2 · Ativação de Conta

`✅ 0 existentes · ⬜ 12 ausentes`

| Cenário | Arquivo | Tipo | Status | Criticidade |
|---------|---------|------|---------|---------|
| POST /users/activation/token/{userId} ADMIN gera token — retorna 200 | `UserActivationController.java` | 🟡 integração | ⬜ | 🔴 Crítico |
| POST /users/activation/token/{userId} usuário inexistente — retorna 404 | `UserActivationController.java` | 🟡 integração | ⬜ | 🔴 Crítico |
| POST /users/activation/token/{userId} GESTOR tenta gerar — retorna 403 | `UserActivationController.java` | 🟡 integração | ⬜ | 🔴 Crítico |
| POST /users/activation/token/{userId} OPERADOR tenta gerar — retorna 403 | `UserActivationController.java` | 🟡 integração | ⬜ | 🔴 Crítico |
| POST /users/activation/activate com token válido e lgpd=true — retorna 200 | `UserActivationController.java` | 🟡 integração | ⬜ | 🔴 Crítico |
| POST /users/activation/activate com token inválido — retorna 401 | `UserActivationController.java` | 🟡 integração | ⬜ | 🔴 Crítico |
| POST /users/activation/activate com token expirado — retorna 401 | `UserActivationController.java` | 🟡 integração | ⬜ | 🔴 Crítico |
| POST /users/activation/activate senhas não coincidentes — retorna 400 | `UserActivationController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| POST /users/activation/activate lgpd=false — retorna 400 | `UserActivationController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| POST /users/activation/activate sem token — retorna 400 | `UserActivationController.java` | 🟡 integração | ⬜ | 🔴 Crítico |
| POST /users/activation/activate sem password — retorna 400 | `UserActivationController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| POST /users/activation/activate sem confirmPassword — retorna 400 | `UserActivationController.java` | 🟡 integração | ⬜ | 🟠 Alto |

---

## 3 · Ativos

`✅ 33 existentes · ⬜ 61 ausentes`

### Listagem e Busca

| Cenário | Arquivo | Tipo | Status | Criticidade |
|---------|---------|------|---------|---------|
| GET /assets ADMIN lista todos os ativos — retorna 200 paginado | `features/asset/asset.feature` | 🟡 integração | ✅ | 🟠 Alto |
| GET /assets GESTOR lista apenas ativos da sua unidade | `AssetIntegrationTest.java` | 🟡 integração | ✅ | 🟢 Baixo |
| GET /assets OPERADOR lista apenas seus ativos | `AssetController.java` | 🟡 integração | ⬜ | 🟢 Baixo |
| GET /assets sem autenticação — retorna 401 | `AssetIntegrationTest.java` | 🟡 integração | ✅ | 🔴 Crítico |
| GET /assets com filtro status=AVAILABLE | `AssetFilterE2ETest.java` | 🟡 integração | ✅ | 🟡 Médio |
| GET /assets com filtro status=ASSIGNED | `features/asset/asset.feature` | 🟡 integração | ✅ | 🟡 Médio |
| GET /assets com filtro status=IN_MAINTENANCE | `features/asset/asset.feature` | 🟡 integração | ✅ | 🟡 Médio |
| GET /assets com filtro status=IN_TRANSFER | `AssetController.java` | 🟡 integração | ⬜ | 🔴 Crítico |
| GET /assets com filtro status=RETIRED | `AssetController.java` | 🟡 integração | ⬜ | 🔴 Crítico |
| GET /assets com filtro type=NOTEBOOK | `AssetFilterE2ETest.java` | 🟡 integração | ✅ | 🟡 Médio |
| GET /assets com filtro unitId | `AssetController.java` | 🟡 integração | ⬜ | 🟡 Médio |
| GET /assets com filtro assignedUserId | `AssetController.java` | 🟡 integração | ⬜ | 🟡 Médio |
| GET /assets com filtro assetTag | `AssetFilterE2ETest.java` | 🟡 integração | ✅ | 🟡 Médio |
| GET /assets com filtro model (search) | `AssetController.java` | 🟡 integração | ⬜ | 🟡 Médio |
| GET /assets paginação retorna campos page corretos | `AssetFilterE2ETest.java` | 🟡 integração | ✅ | 🟠 Alto |
| GET /assets GESTOR não vê ativo de outra organização | `AssetMultiTenantE2ETest.java` | 🟡 integração | ✅ | 🔴 Crítico |
| GET /assets ADMIN isolamento entre organizações | `AssetMultiTenantE2ETest.java` | 🟡 integração | ✅ | 🔴 Crítico |
| GET /assets/{id} ADMIN retorna 200 com detalhes | `AssetIntegrationTest.java` | 🟡 integração | ✅ | 🟠 Alto |
| GET /assets/{id} inexistente — retorna 404 | `features/asset/asset.feature` | 🟡 integração | ✅ | 🟠 Alto |
| GET /assets/{id} sem autenticação — retorna 401 | `AssetIntegrationTest.java` | 🟡 integração | ✅ | 🔴 Crítico |
| GET /assets/{id} GESTOR busca ativo da sua unidade — retorna 200 | `AssetController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| GET /assets/{id} GESTOR tenta ativo de outra unidade — retorna 403 | `AssetMultiTenantE2ETest.java` | 🟡 integração | ✅ | 🔴 Crítico |
| GET /assets/{id} OPERADOR busca ativo que lhe pertence — retorna 200 | `AssetController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| GET /assets/{id} OPERADOR tenta ativo de outro usuário — retorna 403 | `AssetController.java` | 🟡 integração | ⬜ | 🔴 Crítico |

### Criação

| Cenário | Arquivo | Tipo | Status | Criticidade |
|---------|---------|------|---------|---------|
| POST /assets/{orgId} ADMIN cria com assetTag explícito — retorna 201 | `features/asset/asset.feature` | 🟡 integração | ✅ | 🟠 Alto |
| POST /assets/{orgId} GESTOR cria ativo na sua unidade — retorna 201 | `AssetCreateE2ETest.java` | 🟡 integração | ✅ | 🟠 Alto |
| POST /assets/{orgId} GESTOR tenta criar em outra unidade — retorna 403 | `features/asset/asset.feature` | 🟡 integração | ✅ | 🔴 Crítico |
| POST /assets/{orgId} OPERADOR não pode criar — retorna 403 | `features/asset/asset.feature` | 🟡 integração | ✅ | 🔴 Crítico |
| POST /assets/{orgId} sem assetTag — retorna 400 | `features/asset/asset.feature` | 🟡 integração | ✅ | 🟠 Alto |
| POST /assets/{orgId} com assetTag duplicado — retorna 400/409 | `AssetCreateE2ETest.java` | 🟡 integração | ✅ | 🟠 Alto |
| POST /assets/{orgId} sem type — retorna 400 | `features/asset/asset.feature` | 🟡 integração | ✅ | 🟠 Alto |
| POST /assets/{orgId} sem model — retorna 400 | `AssetCreateE2ETest.java` | 🟡 integração | ✅ | 🟠 Alto |
| POST /assets/{orgId} sem unitId — retorna 400 | `AssetController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| POST /assets/{orgId} com organizationId inexistente — retorna 404 | `AssetController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| POST /assets/{orgId} com unitId inexistente — retorna 404 | `AssetController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| POST /assets/{orgId}/auto ADMIN cria com assetTag gerado — retorna 201 | `AssetController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| POST /assets/{orgId}/auto assetTag gerado é único | `AssetController.java` | 🟡 integração | ⬜ | 🟢 Baixo |
| POST /assets/{orgId}/auto sem type — retorna 400 | `AssetController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| POST /assets/{orgId}/auto sem model — retorna 400 | `AssetController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| POST /assets/{orgId} com assetTag de exatamente 100 caracteres — retorna 201 | `features/asset/asset.feature` | 🟡 integração | ⬜ | 🟠 Alto |
| POST /assets/{orgId} com assetTag de 101 caracteres — retorna 400 | `features/asset/asset.feature` | 🟡 integração | ⬜ | 🟠 Alto |
| POST /assets/{orgId} com assetTag contendo apenas espaços — retorna 400 | `features/asset/asset.feature` | 🟡 integração | ⬜ | 🟠 Alto |

### Operações de Estado

| Cenário | Arquivo | Tipo | Status | Criticidade |
|---------|---------|------|---------|---------|
| PATCH /assets/{id}/retire ADMIN aposta AVAILABLE — retorna 200 | `AssetRetireE2ETest.java` | 🟡 integração | ✅ | 🔴 Crítico |
| PATCH /assets/{id}/retire ADMIN aposta ASSIGNED — retorna 200 | `AssetController.java` | 🟡 integração | ⬜ | 🔴 Crítico |
| PATCH /assets/{id}/retire ativo já RETIRED — retorna 400 | `AssetRetireE2ETest.java` | 🟡 integração | ✅ | 🔴 Crítico |
| PATCH /assets/{id}/retire GESTOR tenta aposentar — retorna 403 | `features/asset/asset.feature` | 🟡 integração | ✅ | 🔴 Crítico |
| PATCH /assets/{id}/retire OPERADOR tenta aposentar — retorna 403 | `features/asset/asset.feature` | 🟡 integração | ✅ | 🔴 Crítico |
| PATCH /assets/{id}/retire ativo inexistente — retorna 404 | `AssetRetireE2ETest.java` | 🟡 integração | ✅ | 🔴 Crítico |
| PATCH /assets/{assetId}/assign/{userId} ADMIN atribui — retorna 200 | `AssetIntegrationTest.java` | 🟡 integração | ✅ | 🟠 Alto |
| PATCH /assets/{assetId}/assign/{userId} muda status para ASSIGNED | `AssetController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| PATCH /assets/{assetId}/assign/{userId} GESTOR atribui na sua unidade | `AssetController.java` | 🟡 integração | ⬜ | 🟢 Baixo |
| PATCH /assets/{assetId}/assign/{userId} GESTOR tenta outra unidade — 403 | `AssetController.java` | 🟡 integração | ⬜ | 🔴 Crítico |
| PATCH /assets/{assetId}/assign/{userId} OPERADOR tenta — retorna 403 | `features/asset/asset.feature` | 🟡 integração | ✅ | 🔴 Crítico |
| PATCH /assets/{assetId}/assign/{userId} ativo inexistente — retorna 404 | `AssetController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| PATCH /assets/{assetId}/assign/{userId} usuário inexistente — retorna 404 | `AssetController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| PATCH /assets/{assetId}/assign/{userId} ativo em manutenção — retorna 400 | `features/asset/asset.feature` | 🟡 integração | ⬜ | 🟠 Alto |
| PATCH /assets/{assetId}/assign/{userId} ativo IN_TRANSFER — retorna 400 | `features/asset/asset.feature` | 🟡 integração | ⬜ | 🟠 Alto |
| PATCH /assets/{assetId}/assign/{userId} ativo já ASSIGNED — retorna 400 | `features/asset/asset.feature` | 🟡 integração | ⬜ | 🟠 Alto |
| PATCH /assets/{assetId}/assign/{userId} ativo RETIRED — retorna 400 | `features/asset/asset.feature` | 🟡 integração | ⬜ | 🟠 Alto |
| PATCH /assets/{assetId}/unassign ADMIN remove atribuição — retorna 200 | `AssetController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| PATCH /assets/{assetId}/unassign muda status para AVAILABLE | `AssetController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| PATCH /assets/{assetId}/unassign GESTOR — retorna 200 | `AssetController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| PATCH /assets/{assetId}/unassign OPERADOR tenta — retorna 403 | `AssetController.java` | 🟡 integração | ⬜ | 🔴 Crítico |
| PATCH /assets/{assetId}/unassign de ativo AVAILABLE — retorna 400 | `AssetController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| PATCH /assets/{id}/financial ADMIN atualiza dados financeiros | `AssetController.java` | 🟡 integração | ⬜ | 🟢 Baixo |
| PATCH /assets/{id}/financial GESTOR atualiza — retorna 200 | `AssetController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| PATCH /assets/{id}/financial OPERADOR tenta — retorna 403 | `AssetController.java` | 🟡 integração | ⬜ | 🔴 Crítico |

### Contrato de Erros

| Cenário | Arquivo | Tipo | Status | Criticidade |
|---------|---------|------|---------|---------|
| Resposta 400 contém campos obrigatórios do contrato de erro | `ErrorContractE2ETest.java` | 🟡 integração | ✅ | 🟠 Alto |
| Resposta 401 está no formato JSON | `ErrorContractE2ETest.java` | 🟡 integração | ✅ | 🔴 Crítico |
| Resposta 403 não expõe informações internas | `ErrorContractE2ETest.java` | 🟡 integração | ✅ | 🔴 Crítico |
| Resposta 404 está no formato JSON com mensagem | `ErrorContractE2ETest.java` | 🟡 integração | ✅ | 🟠 Alto |

### E2E — Tela de Ativos

| Cenário | Arquivo | Tipo | Status | Criticidade |
|---------|---------|------|---------|---------|
| Página carrega tabela com colunas: Código, Modelo, Tipo, Status, Ações | `asset-management.feature` | 🔵 e2e | ✅ | 🟡 Médio |
| Loading spinner exibe durante fetch | `AssetListPage.tsx` | 🔵 e2e | ⬜ | 🟡 Médio |
| Erro no fetch exibe ErrorBanner | `AssetListPage.tsx` | 🔵 e2e | ⬜ | 🟡 Médio |
| Lista vazia exibe mensagem apropriada | `AssetListPage.tsx` | 🔵 e2e | ⬜ | 🟢 Baixo |
| Filtrar ativos por status disponível | `asset-management.feature` | 🔵 e2e | ✅ | 🟡 Médio |
| Filtrar ativos por status atribuído | `asset-management.feature` | 🔵 e2e | ✅ | 🟡 Médio |
| Filtrar ativos por tipo | `asset-management.feature` | 🔵 e2e | ✅ | 🟡 Médio |
| Buscar ativo por modelo | `asset-management.feature` | 🔵 e2e | ✅ | 🟡 Médio |
| Paginação carrega próxima página | `AssetListPage.tsx` | 🔵 e2e | ⬜ | 🟡 Médio |
| Botão "Novo Ativo" visível para ADMIN e GESTOR | `asset-management.feature` | 🔵 e2e | ✅ | 🟡 Médio |
| Botão "Novo Ativo" oculto para OPERADOR | `asset-management.feature` | 🔵 e2e | ✅ | 🟡 Médio |
| Validar campos obrigatórios ao criar ativo | `asset-management.feature` | 🔵 e2e | ✅ | 🟠 Alto |
| Criar novo ativo com sucesso | `asset-management.feature` | 🔵 e2e | ✅ | 🟠 Alto |
| Erro ao criar ativo exibe mensagem | `AssetListPage.tsx` | 🔵 e2e | ⬜ | 🟢 Baixo |
| Atribuir usuário a ativo disponível | `asset-management.feature` | 🔵 e2e | ✅ | 🔴 Crítico |
| Solicitar manutenção para ativo | `asset-management.feature` | 🔵 e2e | ✅ | 🟢 Baixo |
| Validar descrição mínima de manutenção | `asset-management.feature` | 🔵 e2e | ✅ | 🟢 Baixo |
| Solicitar transferência de ativo | `asset-management.feature` | 🔵 e2e | ✅ | 🟢 Baixo |
| ADMIN vê botão aposentar ativo | `asset-management.feature` | 🔵 e2e | ✅ | 🔴 Crítico |
| GESTOR não vê botão aposentar ativo | `asset-management.feature` | 🔵 e2e | ✅ | 🔴 Crítico |
| Modo insurance exibe ativos com seguro vencendo | `AssetListPage.tsx` | 🔵 e2e | ⬜ | 🟢 Baixo |
| GESTOR vê apenas ativos de sua unidade | `AssetListPage.tsx` | 🔵 e2e | ⬜ | 🟢 Baixo |
| OPERADOR vê apenas seus ativos | `AssetListPage.tsx` | 🔵 e2e | ⬜ | 🟢 Baixo |

### E2E — Detalhes do Ativo

| Cenário | Arquivo | Tipo | Status | Criticidade |
|---------|---------|------|---------|---------|
| Visualizar detalhes de um ativo | `asset-management.feature` | 🔵 e2e | ✅ | 🟢 Baixo |
| Ativo inexistente exibe página de erro | `AssetDetailsPage.tsx` | 🔵 e2e | ⬜ | 🟢 Baixo |
| Navegar para aba de depreciação | `asset-management.feature` | 🔵 e2e | ✅ | 🟡 Médio |
| Navegar para aba de histórico | `asset-management.feature` | 🔵 e2e | ✅ | 🟡 Médio |
| Navegar para aba de seguro | `AssetDetailsPage.tsx` | 🔵 e2e | ⬜ | 🟡 Médio |
| Botões de ação visíveis conforme permissões | `AssetDetailsPage.tsx` | 🔵 e2e | ⬜ | 🟢 Baixo |
| Exportar CSV da lista de ativos | `asset-management.feature` | 🔵 e2e | ✅ | 🟠 Alto |

---

## 4 · Histórico de Ativos

`✅ 0 existentes · ⬜ 8 ausentes`

| Cenário | Arquivo | Tipo | Status | Criticidade |
|---------|---------|------|---------|---------|
| GET /assets/{id}/history/status ADMIN lista histórico de status | `AssetHistoryController.java` | 🟡 integração | ⬜ | 🟢 Baixo |
| GET /assets/{id}/history/status GESTOR lista histórico do seu ativo | `AssetHistoryController.java` | 🟡 integração | ⬜ | 🟢 Baixo |
| GET /assets/{id}/history/status OPERADOR tenta listar — retorna 403 | `AssetHistoryController.java` | 🟡 integração | ⬜ | 🔴 Crítico |
| GET /assets/{id}/history/status ativo inexistente — retorna 404 | `AssetHistoryController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| GET /assets/{id}/history/status retorna ordenado da mais recente | `AssetHistoryController.java` | 🟡 integração | ⬜ | 🟢 Baixo |
| GET /assets/{id}/history/assignment ADMIN lista histórico de atribuições | `AssetHistoryController.java` | 🟡 integração | ⬜ | 🟢 Baixo |
| GET /assets/{id}/history/assignment GESTOR lista do seu ativo | `AssetHistoryController.java` | 🟡 integração | ⬜ | 🟢 Baixo |
| GET /assets/{id}/history/assignment ativo inexistente — retorna 404 | `AssetHistoryController.java` | 🟡 integração | ⬜ | 🟠 Alto |

---

## 5 · Manutenção

`✅ 39 existentes · ⬜ 30 ausentes`

### Backend — Integração e BDD

| Cenário | Arquivo | Tipo | Status | Criticidade |
|---------|---------|------|---------|---------|
| GET /maintenance ADMIN lista todas as manutenções | `MaintenanceController.java` | 🟡 integração | ⬜ | 🟢 Baixo |
| GET /maintenance GESTOR lista manutenções da sua unidade | `MaintenanceController.java` | 🟡 integração | ⬜ | 🟢 Baixo |
| GET /maintenance OPERADOR vê manutenções de seus ativos | `MaintenanceController.java` | 🟡 integração | ⬜ | 🟢 Baixo |
| GET /maintenance com filtro status=REQUESTED | `MaintenanceController.java` | 🟡 integração | ⬜ | 🟡 Médio |
| GET /maintenance com filtro status=IN_PROGRESS | `MaintenanceController.java` | 🟡 integração | ⬜ | 🟡 Médio |
| GET /maintenance com filtro status=COMPLETED | `MaintenanceController.java` | 🟡 integração | ⬜ | 🟡 Médio |
| GET /maintenance com filtro assetId | `MaintenanceController.java` | 🟡 integração | ⬜ | 🟡 Médio |
| GET /maintenance com filtro unitId | `MaintenanceController.java` | 🟡 integração | ⬜ | 🟡 Médio |
| GET /maintenance com filtro por período de datas | `MaintenanceController.java` | 🟡 integração | ⬜ | 🟡 Médio |
| GET /maintenance/budget ADMIN obtém relatório de orçamento | `MaintenanceController.java` | 🟡 integração | ⬜ | 🟢 Baixo |
| GET /maintenance/budget GESTOR obtém orçamento de sua unidade | `MaintenanceController.java` | 🟡 integração | ⬜ | 🟢 Baixo |
| GET /maintenance/budget OPERADOR tenta acessar — retorna 403 | `MaintenanceController.java` | 🟡 integração | ⬜ | 🔴 Crítico |
| POST /maintenance ADMIN cria solicitação — retorna 201 | `features/maintenance/maintenance.feature` | 🟡 integração | ✅ | 🟠 Alto |
| POST /maintenance GESTOR cria solicitação — retorna 201 | `features/maintenance/maintenance.feature` | 🟡 integração | ✅ | 🟠 Alto |
| POST /maintenance OPERADOR não tem permissão — retorna 403 | `features/maintenance/maintenance.feature` | 🟡 integração | ✅ | 🔴 Crítico |
| POST /maintenance sem assetId — retorna 400 | `MaintenanceController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| POST /maintenance assetId inexistente — retorna 404 | `MaintenanceController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| POST /maintenance sem description — retorna 400 | `features/maintenance/maintenance.feature` | 🟡 integração | ✅ | 🟠 Alto |
| POST /maintenance description < 10 caracteres — retorna 400 | `features/maintenance/maintenance.feature` | 🟡 integração | ✅ | 🟠 Alto |
| POST /maintenance description > 1000 caracteres — retorna 400 | `features/maintenance/maintenance.feature` | 🟡 integração | ✅ | 🟠 Alto |
| POST /maintenance estimatedCost ≤ 0 — retorna 400 | `features/maintenance/maintenance.feature` | 🟡 integração | ✅ | 🟠 Alto |
| POST /maintenance ativo já em manutenção — retorna 400 | `features/maintenance/maintenance.feature` | 🟡 integração | ✅ | 🟠 Alto |
| POST /maintenance ativo aposentado — retorna 400 | `features/maintenance/maintenance.feature` | 🟡 integração | ✅ | 🔴 Crítico |
| POST /maintenance ativo muda status para IN_MAINTENANCE | `MaintenanceController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| POST /maintenance/{id}/start ADMIN inicia REQUESTED — retorna 200 | `MaintenanceController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| POST /maintenance/{id}/start manutenção já IN_PROGRESS — retorna 400 | `features/maintenance/maintenance.feature` | 🟡 integração | ✅ | 🟠 Alto |
| POST /maintenance/{id}/start manutenção COMPLETED — retorna 400 | `features/maintenance/maintenance.feature` | 🟡 integração | ✅ | 🟠 Alto |
| POST /maintenance/{id}/start status muda para IN_PROGRESS | `features/maintenance/maintenance.feature` | 🟡 integração | ✅ | 🟠 Alto |
| POST /maintenance/{id}/complete com resolution — retorna 200 | `features/maintenance/maintenance.feature` | 🟡 integração | ✅ | 🟠 Alto |
| POST /maintenance/{id}/complete sem resolution — retorna 400 | `features/maintenance/maintenance.feature` | 🟡 integração | ✅ | 🟠 Alto |
| POST /maintenance/{id}/complete com resolution vazio — retorna 400 | `features/maintenance/maintenance.feature` | 🟡 integração | ✅ | 🟠 Alto |
| POST /maintenance/{id}/complete manutenção REQUESTED — retorna 400 | `features/maintenance/maintenance.feature` | 🟡 integração | ✅ | 🟠 Alto |
| POST /maintenance/{id}/complete com actualCost registra custo real | `MaintenanceController.java` | 🟡 integração | ⬜ | 🟢 Baixo |
| POST /maintenance/{id}/complete ativo retorna a AVAILABLE | `features/maintenance/maintenance.feature` | 🟡 integração | ✅ | 🔴 Crítico |
| POST /maintenance/{id}/cancel ADMIN cancela REQUESTED — retorna 200 | `features/maintenance/maintenance.feature` | 🟡 integração | ✅ | 🟠 Alto |
| POST /maintenance/{id}/cancel manutenção COMPLETED — retorna 400 | `features/maintenance/maintenance.feature` | 🟡 integração | ✅ | 🟠 Alto |
| POST /maintenance/{id}/cancel ativo retorna a AVAILABLE | `features/maintenance/maintenance.feature` | 🟡 integração | ✅ | 🔴 Crítico |
| POST /maintenance ativo IN_TRANSFER — retorna 400 | `features/maintenance/maintenance.feature` | 🟡 integração | ✅ | 🔴 Crítico |
| POST /maintenance com description contendo apenas espaços — retorna 400 | `features/maintenance/maintenance.feature` | 🟡 integração | ✅ | 🟠 Alto |
| POST /maintenance/{id}/complete com resolution contendo apenas espaços — retorna 400 | `features/maintenance/maintenance.feature` | 🟡 integração | ✅ | 🟠 Alto |
| POST /maintenance/{id}/complete manutenção CANCELLED — retorna 400 | `features/maintenance/maintenance.feature` | 🟡 integração | ✅ | 🟠 Alto |
| POST /maintenance/{id}/cancel manutenção CANCELLED — retorna 400 | `features/maintenance/maintenance.feature` | 🟡 integração | ✅ | 🟠 Alto |
| GET /maintenance/{id} manutenção inexistente — retorna 404 | `MaintenanceController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| POST /maintenance/{id}/start OPERADOR tenta iniciar — retorna 403 | `MaintenanceController.java` | 🟡 integração | ⬜ | 🔴 Crítico |
| POST /maintenance/{id}/complete OPERADOR tenta concluir — retorna 403 | `MaintenanceController.java` | 🟡 integração | ⬜ | 🔴 Crítico |

### Unitário — Service e Domain

| Cenário | Arquivo | Tipo | Status | Criticidade |
|---------|---------|------|---------|---------|
| MaintenanceService.create muda ativo para IN_MAINTENANCE | `MaintenanceServiceTest.java` | 🟢 unitário | ✅ | 🟠 Alto |
| MaintenanceService.create lança NotFoundException — ativo inexistente | `MaintenanceServiceTest.java` | 🟢 unitário | ✅ | 🟠 Alto |
| MaintenanceService.create lança BusinessException — já há manutenção ativa | `MaintenanceServiceTest.java` | 🟢 unitário | ✅ | 🟠 Alto |
| MaintenanceService.start inicia manutenção corretamente | `MaintenanceServiceTest.java` | 🟢 unitário | ✅ | 🟠 Alto |
| MaintenanceService.start lança NotFoundException — manutenção inexistente | `MaintenanceServiceTest.java` | 🟢 unitário | ✅ | 🟠 Alto |
| MaintenanceService.start lança BusinessException — validação falha | `MaintenanceServiceTest.java` | 🟢 unitário | ✅ | 🟠 Alto |
| MaintenanceService.complete retorna ativo para AVAILABLE | `MaintenanceServiceTest.java` | 🟢 unitário | ✅ | 🔴 Crítico |
| MaintenanceService.complete retorna ativo para ASSIGNED quando havia usuário | `MaintenanceServiceTest.java` | 🟢 unitário | ✅ | 🟠 Alto |
| MaintenanceService.complete lança BusinessException — resolução ausente | `MaintenanceServiceTest.java` | 🟢 unitário | ✅ | 🟠 Alto |
| MaintenanceService.cancel libera ativo | `MaintenanceServiceTest.java` | 🟢 unitário | ✅ | 🟠 Alto |
| MaintenanceService.cancel lança BusinessException — cancelar COMPLETED | `MaintenanceServiceTest.java` | 🟢 unitário | ✅ | 🟠 Alto |
| MaintenanceRecord inicia como REQUESTED com datas corretas | `MaintenanceRecordTest.java` | 🟢 unitário | ✅ | 🟠 Alto |
| MaintenanceRecord falha quando asset é null | `MaintenanceRecordTest.java` | 🟢 unitário | ✅ | 🟠 Alto |
| MaintenanceRecord falha quando descrição é inválida | `MaintenanceRecordTest.java` | 🟢 unitário | ✅ | 🟠 Alto |
| MaintenanceRecord falha quando asset pertence a outra organização | `MaintenanceRecordTest.java` | 🟢 unitário | ✅ | 🔴 Crítico |
| MaintenanceRecord falha quando asset pertence a outra unidade | `MaintenanceRecordTest.java` | 🟢 unitário | ✅ | 🔴 Crítico |
| MaintenanceRecord inicia corretamente | `MaintenanceRecordTest.java` | 🟢 unitário | ✅ | 🟠 Alto |
| MaintenanceRecord falha ao iniciar fora do estado REQUESTED | `MaintenanceRecordTest.java` | 🟢 unitário | ✅ | 🟠 Alto |
| MaintenanceRecord falha quando userId é null | `MaintenanceRecordTest.java` | 🟢 unitário | ✅ | 🟠 Alto |
| MaintenanceRecord conclui manutenção corretamente | `MaintenanceRecordTest.java` | 🟢 unitário | ✅ | 🟠 Alto |
| MaintenanceRecord falha ao concluir fora do estado IN_PROGRESS | `MaintenanceRecordTest.java` | 🟢 unitário | ✅ | 🟠 Alto |
| MaintenanceRecord cancela manutenção REQUESTED | `MaintenanceRecordTest.java` | 🟢 unitário | ✅ | 🟠 Alto |
| MaintenanceRecord cancela manutenção IN_PROGRESS | `MaintenanceRecordTest.java` | 🟢 unitário | ✅ | 🟠 Alto |
| MaintenanceRecord.isActive verdadeiro para estados ativos | `MaintenanceRecordTest.java` | 🟢 unitário | ✅ | 🟠 Alto |
| MaintenanceRecord.isActive falso para estados finais | `MaintenanceRecordTest.java` | 🟢 unitário | ✅ | 🟠 Alto |

### E2E — Tela de Manutenção

| Cenário | Arquivo | Tipo | Status | Criticidade |
|---------|---------|------|---------|---------|
| Exibir tela de manutenção com ações principais | `maintenance-management.feature` | 🔵 e2e | ✅ | 🟡 Médio |
| Validar descrição mínima ao abrir manutenção | `maintenance-management.feature` | 🔵 e2e | ✅ | 🟢 Baixo |
| Criar e cancelar manutenção pela tela dedicada | `maintenance-management.feature` | 🔵 e2e | ✅ | 🟠 Alto |
| Criar, iniciar e concluir manutenção pela tela dedicada | `maintenance-management.feature` | 🔵 e2e | ✅ | 🟠 Alto |
| Filtro status REQUESTED filtra manutenções | `maintenance-management.feature` | 🔵 e2e | ✅ | 🟡 Médio |
| Filtro status IN_PROGRESS filtra manutenções | `maintenance-management.feature` | 🔵 e2e | ✅ | 🟡 Médio |
| ADMIN vê botão criar manutenção | `MaintenancePage.tsx` | 🔵 e2e | ⬜ | 🟡 Médio |
| OPERADOR não vê botão criar | `MaintenancePage.tsx` | 🔵 e2e | ⬜ | 🟡 Médio |
| Campo resolução obrigatório na conclusão | `maintenance-management.feature` | 🔵 e2e | ✅ | 🟠 Alto |
| Relatório de orçamento exibe valores | `MaintenancePage.tsx` | 🔵 e2e | ⬜ | 🟡 Médio |

---

## 6 · Transferências

`✅ 30 existentes · ⬜ 24 ausentes`

### Backend

| Cenário | Arquivo | Tipo | Status | Criticidade |
|---------|---------|------|---------|---------|
| GET /transfers ADMIN lista todas as transferências | `TransferController.java` | 🟡 integração | ⬜ | 🟢 Baixo |
| GET /transfers GESTOR lista transferências da sua unidade | `TransferController.java` | 🟡 integração | ⬜ | 🟢 Baixo |
| GET /transfers com filtro status=PENDING | `TransferController.java` | 🟡 integração | ⬜ | 🟡 Médio |
| GET /transfers com filtro assetId | `TransferController.java` | 🟡 integração | ⬜ | 🟡 Médio |
| GET /transfers com filtro unitId | `TransferController.java` | 🟡 integração | ⬜ | 🟡 Médio |
| GET /transfers com filtro por período de datas | `TransferController.java` | 🟡 integração | ⬜ | 🟡 Médio |
| POST /transfers ADMIN solicita — retorna 201 com status PENDING | `features/transfer/transfer.feature` | 🟡 integração | ✅ | 🟠 Alto |
| POST /transfers sem assetId — retorna 400 | `features/transfer/transfer.feature` | 🟡 integração | ✅ | 🟠 Alto |
| POST /transfers assetId inexistente — retorna 404 | `TransferController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| POST /transfers sem toUnitId — retorna 400 | `features/transfer/transfer.feature` | 🟡 integração | ✅ | 🟠 Alto |
| POST /transfers toUnitId inexistente — retorna 404 | `TransferController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| POST /transfers sem reason — retorna 400 | `features/transfer/transfer.feature` | 🟡 integração | ✅ | 🟠 Alto |
| POST /transfers para a mesma unidade — retorna 400 | `features/transfer/transfer.feature` | 🟡 integração | ✅ | 🟠 Alto |
| POST /transfers ativo muda status para IN_TRANSFER | `TransferController.java` | 🟡 integração | ⬜ | 🔴 Crítico |
| PATCH /transfers/{id}/approve ADMIN aprova — retorna 204 | `TransferController.java` | 🟡 integração | ⬜ | 🟢 Baixo |
| PATCH /transfers/{id}/approve GESTOR aprova com comentário — retorna 204 | `TransferController.java` | 🟡 integração | ⬜ | 🟢 Baixo |
| PATCH /transfers/{id}/approve OPERADOR tenta aprovar — retorna 403 | `features/transfer/transfer.feature` | 🟡 integração | ✅ | 🔴 Crítico |
| PATCH /transfers/{id}/approve transferência já aprovada — retorna 400 | `TransferController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| PATCH /transfers/{id}/approve status muda para APPROVED | `features/transfer/transfer.feature` | 🟡 integração | ✅ | 🟠 Alto |
| PATCH /transfers/{id}/reject ADMIN rejeita — retorna 204 | `TransferController.java` | 🟡 integração | ⬜ | 🟢 Baixo |
| PATCH /transfers/{id}/reject ativo retorna a AVAILABLE | `features/transfer/transfer.feature` | 🟡 integração | ✅ | 🔴 Crítico |
| PATCH /transfers/{id}/complete conclui transferência aprovada | `features/transfer/transfer.feature` | 🟡 integração | ✅ | 🟢 Baixo |
| PATCH /transfers/{id}/complete sem aprovação prévia — retorna 400 | `features/transfer/transfer.feature` | 🟡 integração | ✅ | 🟠 Alto |
| PATCH /transfers/{id}/complete ativo move para unidade destino | `TransferController.java` | 🟡 integração | ⬜ | 🟢 Baixo |
| PATCH /transfers/{id}/cancel cancela transferência PENDING | `features/transfer/transfer.feature` | 🟡 integração | ✅ | 🟠 Alto |
| PATCH /transfers/{id}/cancel transferência aprovada — retorna 400 | `features/transfer/transfer.feature` | 🟡 integração | ✅ | 🟠 Alto |
| PATCH /transfers/{id}/cancel ativo retorna a AVAILABLE | `features/transfer/transfer.feature` | 🟡 integração | ✅ | 🔴 Crítico |
| POST /transfers com reason contendo apenas espaços — retorna 400 | `features/transfer/transfer.feature` | 🟡 integração | ✅ | 🟠 Alto |
| POST /transfers ativo IN_MAINTENANCE — retorna 400 | `features/transfer/transfer.feature` | 🟡 integração | ✅ | 🔴 Crítico |
| POST /transfers ativo ASSIGNED — retorna 400 | `features/transfer/transfer.feature` | 🟡 integração | ✅ | 🔴 Crítico |
| POST /transfers ativo RETIRED — retorna 400 | `features/transfer/transfer.feature` | 🟡 integração | ✅ | 🔴 Crítico |
| POST /transfers ativo IN_TRANSFER (duplicada) — retorna 400 | `features/transfer/transfer.feature` | 🟡 integração | ⬜ | 🔴 Crítico |
| PATCH /transfers/{id}/approve transferência REJECTED — retorna 400 | `features/transfer/transfer.feature` | 🟡 integração | ⬜ | 🟠 Alto |
| PATCH /transfers/{id}/approve transferência CANCELLED — retorna 400 | `features/transfer/transfer.feature` | 🟡 integração | ✅ | 🟠 Alto |
| PATCH /transfers/{id}/reject transferência APPROVED — retorna 400 | `features/transfer/transfer.feature` | 🟡 integração | ✅ | 🟠 Alto |
| PATCH /transfers/{id}/complete transferência REJECTED — retorna 400 | `features/transfer/transfer.feature` | 🟡 integração | ✅ | 🟠 Alto |
| PATCH /transfers/{id}/complete transferência CANCELLED — retorna 400 | `features/transfer/transfer.feature` | 🟡 integração | ✅ | 🟠 Alto |
| PATCH /transfers/{id}/approve transferência já aprovada — retorna 400 | `features/transfer/transfer.feature` | 🟡 integração | ✅ | 🟠 Alto |
| PATCH /transfers/{id}/reject transferência já rejeitada — retorna 400 | `features/transfer/transfer.feature` | 🟡 integração | ✅ | 🟠 Alto |
| PATCH /transfers/{id}/cancel transferência já cancelada — retorna 400 | `features/transfer/transfer.feature` | 🟡 integração | ✅ | 🟠 Alto |
| PATCH /transfers/{id}/complete transferência completada — retorna 400 | `features/transfer/transfer.feature` | 🟡 integração | ✅ | 🟠 Alto |
| GET /transfers/{id} inexistente — retorna 404 | `TransferController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| PATCH /transfers/{id}/approve GESTOR de unidade não envolvida — retorna 403 | `TransferController.java` | 🟡 integração | ⬜ | 🔴 Crítico |

### E2E — Tela de Transferências

| Cenário | Arquivo | Tipo | Status | Criticidade |
|---------|---------|------|---------|---------|
| Exibir tela de transferências com ações principais | `transfer-management.feature` | 🔵 e2e | ✅ | 🟡 Médio |
| Validar motivo mínimo ao criar transferência | `transfer-management.feature` | 🔵 e2e | ✅ | 🟢 Baixo |
| Criar e cancelar transferência pela tela dedicada | `transfer-management.feature` | 🔵 e2e | ✅ | 🟠 Alto |
| Criar, aprovar e concluir transferência pela tela dedicada | `transfer-management.feature` | 🔵 e2e | ✅ | 🟠 Alto |
| Criar e rejeitar transferência pela tela dedicada | `transfer-management.feature` | 🔵 e2e | ✅ | 🟠 Alto |
| Filtro status filtra transferências | `transfer-management.feature` | 🔵 e2e | ✅ | 🟡 Médio |
| Detalhe da transferência exibe informações completas | `transfer-management.feature` | 🔵 e2e | ✅ | 🟡 Médio |
| Paginação de transferências funciona | `TransfersPage.tsx` | 🔵 e2e | ⬜ | 🟡 Médio |

---

## 7 · Depreciação

`✅ 7 existentes · ⬜ 9 ausentes`

| Cenário | Arquivo | Tipo | Status | Criticidade |
|---------|---------|------|---------|---------|
| DepreciationService — método LINEAR após 12 meses é proporcional | `DepreciationServiceTest.java` | 🟢 unitário | ✅ | 🟠 Alto |
| DepreciationService — respeita valor residual mínimo | `DepreciationServiceTest.java` | 🟢 unitário | ✅ | 🟠 Alto |
| DepreciationService — atinge 100% ao final da vida útil | `DepreciationServiceTest.java` | 🟢 unitário | ✅ | 🟠 Alto |
| DepreciationService — DECLINING_BALANCE deprecia mais rápido no início | `DepreciationServiceTest.java` | 🟢 unitário | ✅ | 🟠 Alto |
| DepreciationService — SUM_OF_YEARS deprecia mais rápido no início | `DepreciationServiceTest.java` | 🟢 unitário | ✅ | 🟠 Alto |
| DepreciationService — lança exceção sem purchaseValue | `DepreciationServiceTest.java` | 🟢 unitário | ✅ | 🟠 Alto |
| DepreciationService — lança exceção sem vida útil | `DepreciationServiceTest.java` | 🟢 unitário | ✅ | 🟠 Alto |
| GET /assets/{id}/depreciation calcula depreciação LINEAR | `DepreciationController.java` | 🟡 integração | ⬜ | 🟢 Baixo |
| GET /assets/{id}/depreciation calcula depreciação DECLINING_BALANCE | `DepreciationController.java` | 🟡 integração | ⬜ | 🟢 Baixo |
| GET /assets/{id}/depreciation calcula depreciação SUM_OF_YEARS | `DepreciationController.java` | 🟡 integração | ⬜ | 🟢 Baixo |
| GET /assets/{id}/depreciation sem purchaseValue — retorna valores nulos | `DepreciationController.java` | 🟡 integração | ⬜ | 🟢 Baixo |
| GET /assets/depreciation/portfolio ADMIN obtém valor total | `DepreciationController.java` | 🟡 integração | ⬜ | 🟢 Baixo |
| GET /assets/depreciation/portfolio GESTOR tenta acessar — retorna 403 | `DepreciationController.java` | 🟡 integração | ⬜ | 🔴 Crítico |
| GET /assets/depreciation/report ADMIN obtém relatório completo | `DepreciationController.java` | 🟡 integração | ⬜ | 🟢 Baixo |
| GET /assets/depreciation/report GESTOR obtém — retorna 200 | `DepreciationController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| Aba de depreciação exibe valores calculados | `asset-management.feature` | 🔵 e2e | ✅ | 🟡 Médio |

---

## 8 · Seguro de Ativos

`✅ 0 existentes · ⬜ 13 ausentes`

| Cenário | Arquivo | Tipo | Status | Criticidade |
|---------|---------|------|---------|---------|
| POST /assets/{id}/insurance ADMIN registra seguro — retorna 201 | `InsuranceController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| POST /assets/{id}/insurance GESTOR registra — retorna 201 | `InsuranceController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| POST /assets/{id}/insurance OPERADOR tenta — retorna 403 | `InsuranceController.java` | 🟡 integração | ⬜ | 🔴 Crítico |
| DELETE /assets/insurance/{id} ADMIN remove seguro — retorna 204 | `InsuranceController.java` | 🟡 integração | ⬜ | 🟢 Baixo |
| DELETE /assets/insurance/{id} GESTOR remove — retorna 204 | `InsuranceController.java` | 🟡 integração | ⬜ | 🟢 Baixo |
| GET /assets/{id}/insurance lista seguros do ativo | `InsuranceController.java` | 🟡 integração | ⬜ | 🟢 Baixo |
| GET /assets/{id}/insurance/active obtém seguro ativo | `InsuranceController.java` | 🟡 integração | ⬜ | 🟢 Baixo |
| GET /assets/{id}/insurance/active seguro inexistente — retorna 404 | `InsuranceController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| GET /assets/insurance/expiring ADMIN lista seguros vencendo em 30 dias | `InsuranceController.java` | 🟡 integração | ⬜ | 🟢 Baixo |
| GET /assets/insurance/expiring GESTOR lista — retorna 200 | `InsuranceController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| GET /assets/insurance/summary ADMIN obtém resumo — retorna 200 | `InsuranceController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| GET /assets/insurance/summary GESTOR obtém — retorna 200 | `InsuranceController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| Aba de seguro exibe informações de cobertura | `AssetDetailsPage.tsx` | 🔵 e2e | ⬜ | 🟡 Médio |

---

## 9 · Usuários

`✅ 0 existentes · ⬜ 38 ausentes`

| Cenário | Arquivo | Tipo | Status | Criticidade |
|---------|---------|------|---------|---------|
| GET /users ADMIN lista todos com paginação — retorna 200 | `UserController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| GET /users GESTOR lista usuários da sua unidade | `UserController.java` | 🟡 integração | ⬜ | 🟢 Baixo |
| GET /users OPERADOR tenta listar — retorna 403 | `UserController.java` | 🟡 integração | ⬜ | 🔴 Crítico |
| GET /users com filtro status=ACTIVE | `UserController.java` | 🟡 integração | ⬜ | 🟡 Médio |
| GET /users com filtro status=INACTIVE | `UserController.java` | 🟡 integração | ⬜ | 🟡 Médio |
| GET /users com filtro unitId | `UserController.java` | 🟡 integração | ⬜ | 🟡 Médio |
| GET /users com includeInactive=true retorna inativos | `UserController.java` | 🟡 integração | ⬜ | 🟢 Baixo |
| GET /users sem autenticação — retorna 401 | `UserController.java` | 🟡 integração | ⬜ | 🔴 Crítico |
| GET /users paginação página 0 — retorna 20 registros | `UserController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| GET /users/{id} ADMIN busca existente — retorna 200 | `UserController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| GET /users/{id} inexistente — retorna 404 | `UserController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| GET /users/{id} GESTOR tenta buscar usuário de outra unidade — 403 | `UserController.java` | 🟡 integração | ⬜ | 🔴 Crítico |
| GET /users/{id} OPERADOR tenta — retorna 403 | `UserController.java` | 🟡 integração | ⬜ | 🔴 Crítico |
| POST /users ADMIN cria com todos os campos — retorna 201 | `UserController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| POST /users ADMIN cria sem telefone — retorna 201 | `UserController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| POST /users ADMIN cria com role ADMIN | `UserController.java` | 🟡 integração | ⬜ | 🟢 Baixo |
| POST /users ADMIN cria com role GESTOR | `UserController.java` | 🟡 integração | ⬜ | 🟢 Baixo |
| POST /users ADMIN cria com role OPERADOR | `UserController.java` | 🟡 integração | ⬜ | 🟢 Baixo |
| POST /users GESTOR tenta criar — retorna 403 | `UserController.java` | 🟡 integração | ⬜ | 🔴 Crítico |
| POST /users sem name — retorna 400 | `UserController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| POST /users sem email — retorna 400 | `UserController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| POST /users com email formato inválido — retorna 400 | `UserController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| POST /users com email duplicado — retorna 409 | `UserController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| POST /users sem documentNumber — retorna 400 | `UserController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| POST /users com CPF inválido — retorna 400 | `UserController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| POST /users com CNPJ inválido — retorna 400 | `UserController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| POST /users sem role — retorna 400 | `UserController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| POST /users sem organizationId — retorna 400 | `UserController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| POST /users com organizationId inexistente — retorna 404 | `UserController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| POST /users com unitId inexistente — retorna 404 | `UserController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| POST /users com phoneNumber formato E.164 inválido — retorna 400 | `UserController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| PATCH /users/{id}/block ADMIN bloqueia ativo — retorna 200 | `UserController.java` | 🟡 integração | ⬜ | 🔴 Crítico |
| PATCH /users/{id}/block usuário já bloqueado — retorna 400 | `UserController.java` | 🟡 integração | ⬜ | 🔴 Crítico |
| PATCH /users/{id}/activate ADMIN ativa inativo — retorna 200 | `UserController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| PATCH /users/{id}/activate usuário já ativo — retorna 400 | `UserController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| PATCH /users/{id}/inactivate ADMIN inativa ativo — retorna 200 | `UserController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| Página de usuários carrega listagem | `UsersPage.tsx` | 🔵 e2e | ⬜ | 🟡 Médio |
| Modal de criação valida campos obrigatórios | `UsersPage.tsx` | 🔵 e2e | ⬜ | 🟠 Alto |

---

## 10 · Organizações

`✅ 0 existentes · ⬜ 14 ausentes`

| Cenário | Arquivo | Tipo | Status | Criticidade |
|---------|---------|------|---------|---------|
| GET /organizations ADMIN lista todas — retorna 200 | `OrganizationController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| GET /organizations GESTOR tenta listar — retorna 403 | `OrganizationController.java` | 🟡 integração | ⬜ | 🔴 Crítico |
| GET /organizations/{id} ADMIN busca existente — retorna 200 | `OrganizationController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| GET /organizations/{id} inexistente — retorna 404 | `OrganizationController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| POST /organizations ADMIN cria — retorna 201 | `OrganizationController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| POST /organizations GESTOR tenta — retorna 403 | `OrganizationController.java` | 🟡 integração | ⬜ | 🔴 Crítico |
| POST /organizations sem name — retorna 400 | `OrganizationController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| POST /organizations com name vazio — retorna 400 | `OrganizationController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| PATCH /organizations/{id} ADMIN atualiza nome — retorna 200 | `OrganizationController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| PATCH /organizations/{id} com name vazio — retorna 400 | `OrganizationController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| PATCH /organizations/{id}/activate ADMIN ativa INACTIVE — retorna 200 | `OrganizationController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| PATCH /organizations/{id}/activate já ACTIVE — retorna 400 | `OrganizationController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| PATCH /organizations/{id}/inactivate ADMIN inativa — retorna 200 | `OrganizationController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| Página de organizações ADMIN pode criar nova | `OrganizationsPage.tsx` | 🔵 e2e | ⬜ | 🟢 Baixo |

---

## 11 · Unidades

`✅ 0 existentes · ⬜ 12 ausentes`

| Cenário | Arquivo | Tipo | Status | Criticidade |
|---------|---------|------|---------|---------|
| POST /units/{orgId} ADMIN cria unidade — retorna 201 | `UnitController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| POST /units/{orgId} GESTOR cria — retorna 201 | `UnitController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| POST /units/{orgId} OPERADOR tenta — retorna 403 | `UnitController.java` | 🟡 integração | ⬜ | 🔴 Crítico |
| POST /units/{orgId} sem name — retorna 400 | `UnitController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| POST /units/{orgId} organizationId inexistente — retorna 404 | `UnitController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| GET /units/{orgId} ADMIN lista unidades da organização | `UnitController.java` | 🟡 integração | ⬜ | 🟢 Baixo |
| GET /units/{orgId} GESTOR lista — retorna 200 | `UnitController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| GET /units/unit/{id} ADMIN busca por ID — retorna 200 | `UnitController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| GET /units/unit/{id} inexistente — retorna 404 | `UnitController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| PATCH /units/{id}/activate ADMIN ativa — retorna 200 | `UnitController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| PATCH /units/{id}/inactivate ADMIN inativa — retorna 200 | `UnitController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| Página de unidades ADMIN pode criar nova | `UnitsPage.tsx` | 🔵 e2e | ⬜ | 🟢 Baixo |

---

## 12 · Categorias

`✅ 0 existentes · ⬜ 13 ausentes`

| Cenário | Arquivo | Tipo | Status | Criticidade |
|---------|---------|------|---------|---------|
| POST /categories ADMIN cria — retorna 201 | `AssetCategoryController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| POST /categories GESTOR cria — retorna 201 | `AssetCategoryController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| POST /categories OPERADOR tenta — retorna 403 | `AssetCategoryController.java` | 🟡 integração | ⬜ | 🔴 Crítico |
| POST /categories sem name — retorna 400 | `AssetCategoryController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| GET /categories ADMIN lista — retorna 200 | `AssetCategoryController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| GET /categories GESTOR lista — retorna 200 | `AssetCategoryController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| GET /categories OPERADOR lista — retorna 200 | `AssetCategoryController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| GET /categories/{id} busca existente — retorna 200 | `AssetCategoryController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| GET /categories/{id} inexistente — retorna 404 | `AssetCategoryController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| PUT /categories/{id} ADMIN atualiza — retorna 200 | `AssetCategoryController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| PUT /categories/{id} GESTOR atualiza — retorna 200 | `AssetCategoryController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| DELETE /categories/{id} ADMIN desativa — retorna 204 | `AssetCategoryController.java` | 🟡 integração | ⬜ | 🟢 Baixo |
| DELETE /categories/{id} GESTOR desativa — retorna 204 | `AssetCategoryController.java` | 🟡 integração | ⬜ | 🟢 Baixo |

---

## 13 · Centro de Custo

`✅ 0 existentes · ⬜ 6 ausentes`

| Cenário | Arquivo | Tipo | Status | Criticidade |
|---------|---------|------|---------|---------|
| GET /cost-centers ADMIN lista ativos — retorna 200 | `CostCenterController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| GET /cost-centers GESTOR tenta — retorna 403 | `CostCenterController.java` | 🟡 integração | ⬜ | 🔴 Crítico |
| POST /cost-centers ADMIN cria — retorna 201 | `CostCenterController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| POST /cost-centers sem code — retorna 400 | `CostCenterController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| POST /cost-centers sem name — retorna 400 | `CostCenterController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| PATCH /cost-centers/{id}/deactivate ADMIN desativa — retorna 204 | `CostCenterController.java` | 🟡 integração | ⬜ | 🟢 Baixo |

---

## 14 · Inventário

`✅ 0 existentes · ⬜ 19 ausentes`

| Cenário | Arquivo | Tipo | Status | Criticidade |
|---------|---------|------|---------|---------|
| POST /inventory ADMIN cria sessão — retorna 200 | `InventoryController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| POST /inventory GESTOR cria — retorna 200 | `InventoryController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| POST /inventory OPERADOR tenta — retorna 403 | `InventoryController.java` | 🟡 integração | ⬜ | 🔴 Crítico |
| POST /inventory sem unitId — retorna 400 | `InventoryController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| POST /inventory unitId inexistente — retorna 404 | `InventoryController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| GET /inventory ADMIN lista todas — retorna 200 | `InventoryController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| GET /inventory GESTOR lista — retorna 200 | `InventoryController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| GET /inventory/{id} busca existente — retorna 200 | `InventoryController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| GET /inventory/{id} inexistente — retorna 404 | `InventoryController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| PATCH /inventory/{id}/start ADMIN inicia CREATED — retorna 200 | `InventoryController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| PATCH /inventory/{id}/start sessão já IN_PROGRESS — retorna 409 | `InventoryController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| PATCH /inventory/{id}/start status muda para IN_PROGRESS | `InventoryController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| PATCH /inventory/{id}/close ADMIN fecha IN_PROGRESS — retorna 200 | `InventoryController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| PATCH /inventory/{id}/close sessão CREATED — retorna 409 | `InventoryController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| PATCH /inventory/{id}/close status muda para CLOSED | `InventoryController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| PATCH /inventory/{id}/cancel ADMIN cancela — retorna 200 | `InventoryController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| PATCH /inventory/{id}/cancel status muda para CANCELLED | `InventoryController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| Página de inventário carrega listagem de sessões | `InventoryPage.tsx` | 🔵 e2e | ⬜ | 🟡 Médio |
| Criar → Iniciar → Fechar sessão de inventário | `InventoryPage.tsx` | 🔵 e2e | ⬜ | 🟢 Baixo |

---

## 15 · Auditoria

`✅ 0 existentes · ⬜ 15 ausentes`

| Cenário | Arquivo | Tipo | Status | Criticidade |
|---------|---------|------|---------|---------|
| GET /audit ADMIN lista eventos da organização | `AuditController.java` | 🟡 integração | ⬜ | 🟡 Médio |
| GET /audit GESTOR lista — retorna 200 | `AuditController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| GET /audit OPERADOR tenta — retorna 403 | `AuditController.java` | 🟡 integração | ⬜ | 🔴 Crítico |
| GET /audit/user/{id} ADMIN lista por usuário | `AuditController.java` | 🟡 integração | ⬜ | 🟡 Médio |
| GET /audit/type/ASSET_CREATED filtra criações | `AuditController.java` | 🟡 integração | ⬜ | 🟡 Médio |
| GET /audit/type/ASSET_ASSIGNED filtra atribuições | `AuditController.java` | 🟡 integração | ⬜ | 🟡 Médio |
| GET /audit/type/ASSET_RETIRED filtra aposentadorias | `AuditController.java` | 🟡 integração | ⬜ | 🔴 Crítico |
| GET /audit/type/USER_CREATED filtra criações de usuário | `AuditController.java` | 🟡 integração | ⬜ | 🟡 Médio |
| GET /audit/target filtra por entidade alvo | `AuditController.java` | 🟡 integração | ⬜ | 🟡 Médio |
| GET /audit/period filtra por intervalo de datas | `AuditController.java` | 🟡 integração | ⬜ | 🟡 Médio |
| GET /audit/period sem start — retorna 400 | `AuditController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| GET /audit/period sem end — retorna 400 | `AuditController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| GET /audit/target/last ADMIN obtém último evento | `AuditController.java` | 🟡 integração | ⬜ | 🟢 Baixo |
| GET /audit/target/last sem eventos — retorna 404 | `AuditController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| Página de auditoria carrega com filtros por tipo e período | `AuditPage.tsx` | 🔵 e2e | ⬜ | 🟡 Médio |

---

## 16 · Dashboard

`✅ 0 existentes · ⬜ 11 ausentes`

| Cenário | Arquivo | Tipo | Status | Criticidade |
|---------|---------|------|---------|---------|
| GET /api/dashboard/executive ADMIN obtém — retorna 200 | `ExecutiveDashboardController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| GET /api/dashboard/executive GESTOR tenta — retorna 403 | `ExecutiveDashboardController.java` | 🟡 integração | ⬜ | 🔴 Crítico |
| GET /api/dashboard/executive contém total de ativos | `ExecutiveDashboardController.java` | 🟡 integração | ⬜ | 🟢 Baixo |
| GET /api/dashboard/executive contém ativos disponíveis | `ExecutiveDashboardController.java` | 🟡 integração | ⬜ | 🟢 Baixo |
| GET /api/dashboard/executive contém ativos atribuídos | `ExecutiveDashboardController.java` | 🟡 integração | ⬜ | 🟢 Baixo |
| GET /api/dashboard/executive contém ativos em manutenção | `ExecutiveDashboardController.java` | 🟡 integração | ⬜ | 🟢 Baixo |
| Dashboard ADMIN carrega AdminDashboard com KPIs | `DashboardPage.tsx` | 🔵 e2e | ⬜ | 🟡 Médio |
| Dashboard GESTOR carrega GestorDashboard com dados da unidade | `DashboardPage.tsx` | 🔵 e2e | ⬜ | 🟡 Médio |
| Dashboard OPERADOR carrega OperadorDashboard | `DashboardPage.tsx` | 🔵 e2e | ⬜ | 🟡 Médio |
| Dashboard exibe estado de loading | `DashboardPage.tsx` | 🔵 e2e | ⬜ | 🟡 Médio |
| Página de relatórios exibe opções de exportação | `ReportsPage.tsx` | 🔵 e2e | ⬜ | 🟢 Baixo |

---

## 17 · Exportação

`✅ 1 existente · ⬜ 9 ausentes`

| Cenário | Arquivo | Tipo | Status | Criticidade |
|---------|---------|------|---------|---------|
| GET /export/assets ADMIN exporta em CSV — retorna 200 | `ExportController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| GET /export/assets GESTOR exporta — retorna 200 | `ExportController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| GET /export/assets OPERADOR tenta — retorna 403 | `ExportController.java` | 🟡 integração | ⬜ | 🔴 Crítico |
| GET /export/assets CSV contém headers corretos | `ExportController.java` | 🟡 integração | ⬜ | 🟢 Baixo |
| GET /export/maintenance ADMIN exporta — retorna 200 | `ExportController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| GET /export/maintenance com filtro de datas | `ExportController.java` | 🟡 integração | ⬜ | 🟡 Médio |
| GET /export/audit ADMIN exporta auditoria — retorna 200 | `ExportController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| GET /export/audit GESTOR tenta — retorna 403 | `ExportController.java` | 🟡 integração | ⬜ | 🔴 Crítico |
| Botão "Exportar CSV" na lista de ativos baixa arquivo | `asset-management.feature` | 🔵 e2e | ✅ | 🟠 Alto |
| Exportar manutenções CSV funciona | `ReportsPage.tsx` | 🔵 e2e | ⬜ | 🟠 Alto |

---

## 18 · AI Insights

`✅ 0 existentes · ⬜ 18 ausentes`

| Cenário | Arquivo | Tipo | Status | Criticidade |
|---------|---------|------|---------|---------|
| POST /api/ai/analysis/observability ADMIN executa — retorna 200 | `AiInsightController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| POST /api/ai/analysis/observability GESTOR executa — retorna 200 | `AiInsightController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| POST /api/ai/analysis/observability OPERADOR tenta — retorna 403 | `AiInsightController.java` | 🟡 integração | ⬜ | 🔴 Crítico |
| POST /api/ai/analysis/test-intelligence ADMIN executa | `AiInsightController.java` | 🟡 integração | ⬜ | 🟢 Baixo |
| POST /api/ai/analysis/cicd ADMIN executa | `AiInsightController.java` | 🟡 integração | ⬜ | 🟢 Baixo |
| POST /api/ai/analysis/incident ADMIN executa | `AiInsightController.java` | 🟡 integração | ⬜ | 🟢 Baixo |
| POST /api/ai/analysis/risk ADMIN executa | `AiInsightController.java` | 🟡 integração | ⬜ | 🟢 Baixo |
| POST /api/ai/analysis/multi-agent ADMIN executa | `AiInsightController.java` | 🟡 integração | ⬜ | 🟢 Baixo |
| POST /api/ai/analysis/multi-agent GESTOR tenta — retorna 403 | `AiInsightController.java` | 🟡 integração | ⬜ | 🔴 Crítico |
| GET /api/ai/analysis/history autenticado obtém histórico | `AiInsightController.java` | 🟡 integração | ⬜ | 🔴 Crítico |
| GET /api/ai/analysis/history com filtro type | `AiInsightController.java` | 🟡 integração | ⬜ | 🟡 Médio |
| GET /api/ai/analysis/history limite máximo de 100 itens | `AiInsightController.java` | 🟡 integração | ⬜ | 🟢 Baixo |
| GET /api/ai/analysis/{id} análise existente — retorna 200 | `AiInsightController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| GET /api/ai/analysis/{id} inexistente — retorna 404 | `AiInsightController.java` | 🟡 integração | ⬜ | 🟠 Alto |
| Página AI Insights ADMIN vê análises disponíveis | `AIInsightsPage.tsx` | 🔵 e2e | ⬜ | 🟢 Baixo |
| Página AI Insights GESTOR vê análises disponíveis | `AIInsightsPage.tsx` | 🔵 e2e | ⬜ | 🟢 Baixo |
| Executar análise de observabilidade funciona | `AIInsightsPage.tsx` | 🔵 e2e | ⬜ | 🟢 Baixo |
| Histórico de análises carrega na página | `AIInsightsPage.tsx` | 🔵 e2e | ⬜ | 🟢 Baixo |

---

## 19 · Arquitetura de Camadas (ArchUnit)

`✅ 9 existentes · ⬜ 0 ausentes`

| Cenário | Arquivo | Tipo | Status | Criticidade |
|---------|---------|------|---------|---------|
| Domain não deve importar classes de Application | `LayerDependencyTest.java` | 🟢 unitário | ✅ | 🟠 Alto |
| Domain não deve importar classes de Interfaces (controllers) | `LayerDependencyTest.java` | 🟢 unitário | ✅ | 🟢 Baixo |
| Domain não deve importar classes de Infrastructure | `LayerDependencyTest.java` | 🟢 unitário | ✅ | 🟢 Baixo |
| Application não deve importar classes de Interfaces (controllers) | `LayerDependencyTest.java` | 🟢 unitário | ✅ | 🟢 Baixo |
| Controllers não devem importar repositórios diretamente | `LayerDependencyTest.java` | 🟢 unitário | ✅ | 🔴 Crítico |
| Classes em interfaces/rest devem terminar com Controller | `LayerDependencyTest.java` | 🟢 unitário | ✅ | 🟢 Baixo |
| Classes anotadas com @Repository devem terminar com Repository | `LayerDependencyTest.java` | 🟢 unitário | ✅ | 🟢 Baixo |
| Classes anotadas com @Service devem terminar com Service | `LayerDependencyTest.java` | 🟢 unitário | ✅ | 🟢 Baixo |
| Controllers não devem retornar entidades de domínio diretamente | `LayerDependencyTest.java` | 🟢 unitário | ✅ | 🔴 Crítico |

---

## 20 · Frontend — Páginas

`✅ 36 existentes · ⬜ 94 ausentes`

### Login

| Cenário | Arquivo | Tipo | Status | Criticidade |
|---------|---------|------|---------|---------|
| Página exibe formulário com campos email e senha | `login.feature` | 🔵 e2e | ✅ | 🟢 Baixo |
| Perfis de demonstração preenchem credenciais | `login.feature` | 🔵 e2e | ✅ | 🟢 Baixo |
| Login inválido exibe erro | `login.feature` | 🔵 e2e | ✅ | 🔴 Crítico |
| Login com ADMIN redireciona para /dashboard | `login.feature` | 🔵 e2e | ✅ | 🔴 Crítico |
| Email vazio desabilita botão de login | `LoginPage.tsx` | 🔵 e2e | ⬜ | 🔴 Crítico |
| Senha vazia desabilita botão de login | `LoginPage.tsx` | 🔵 e2e | ⬜ | 🔴 Crítico |
| Fluxo MFA exibe campo para código de 6 dígitos | `LoginPage.tsx` | 🔵 e2e | ⬜ | 🔴 Crítico |
| Código MFA < 6 dígitos inválido | `LoginPage.tsx` | 🔵 e2e | ⬜ | 🔴 Crítico |
| Código MFA válido redireciona para dashboard | `LoginPage.tsx` | 🔵 e2e | ⬜ | 🔴 Crítico |
| Erro MFA exibe mensagem de falha | `LoginPage.tsx` | 🔵 e2e | ⬜ | 🔴 Crítico |

### Lista de Ativos

| Cenário | Arquivo | Tipo | Status | Criticidade |
|---------|---------|------|---------|---------|
| Tabela de ativos carrega com colunas corretas | `asset-management.feature` | 🔵 e2e | ✅ | 🟢 Baixo |
| Loading spinner exibe durante busca | `AssetListPage.tsx` | 🔵 e2e | ⬜ | 🟡 Médio |
| ErrorBanner exibe quando API retorna erro | `AssetListPage.tsx` | 🔵 e2e | ⬜ | 🟡 Médio |
| Lista vazia exibe "Nenhum ativo encontrado" | `AssetListPage.tsx` | 🔵 e2e | ⬜ | 🟢 Baixo |
| Filtrar ativos por status disponível | `asset-management.feature` | 🔵 e2e | ✅ | 🟡 Médio |
| Filtrar ativos por status atribuído | `asset-management.feature` | 🔵 e2e | ✅ | 🟡 Médio |
| Filtrar ativos por tipo de equipamento | `asset-management.feature` | 🔵 e2e | ✅ | 🟡 Médio |
| Buscar ativo por modelo | `asset-management.feature` | 🔵 e2e | ✅ | 🟡 Médio |
| Paginação carrega próxima página | `AssetListPage.tsx` | 🔵 e2e | ⬜ | 🟡 Médio |
| ADMIN e GESTOR veem botão "Novo Ativo" | `asset-management.feature` | 🔵 e2e | ✅ | 🟢 Baixo |
| OPERADOR não vê botão "Novo Ativo" | `asset-management.feature` | 🔵 e2e | ✅ | 🟡 Médio |
| Validar campos obrigatórios ao criar ativo | `asset-management.feature` | 🔵 e2e | ✅ | 🟠 Alto |
| Criar novo ativo com sucesso | `asset-management.feature` | 🔵 e2e | ✅ | 🟠 Alto |
| Atribuir usuário a ativo disponível | `asset-management.feature` | 🔵 e2e | ✅ | 🔴 Crítico |
| Validar descrição mínima ao solicitar manutenção | `asset-management.feature` | 🔵 e2e | ✅ | 🟢 Baixo |
| Solicitar manutenção para ativo | `asset-management.feature` | 🔵 e2e | ✅ | 🟢 Baixo |
| Solicitar transferência de ativo | `asset-management.feature` | 🔵 e2e | ✅ | 🟢 Baixo |
| ADMIN pode aposentar ativo (botão visível) | `asset-management.feature` | 🔵 e2e | ✅ | 🔴 Crítico |
| GESTOR não vê botão de aposentar | `asset-management.feature` | 🔵 e2e | ✅ | 🔴 Crítico |
| GESTOR vê apenas ativos de sua unidade | `AssetListPage.tsx` | 🔵 e2e | ⬜ | 🟢 Baixo |
| OPERADOR vê apenas seus ativos | `AssetListPage.tsx` | 🔵 e2e | ⬜ | 🟢 Baixo |

### Detalhes do Ativo

| Cenário | Arquivo | Tipo | Status | Criticidade |
|---------|---------|------|---------|---------|
| Visualizar detalhes de um ativo | `asset-management.feature` | 🔵 e2e | ✅ | 🟢 Baixo |
| Ativo inexistente exibe erro 404 | `AssetDetailsPage.tsx` | 🔵 e2e | ⬜ | 🟢 Baixo |
| Tab "Informações" exibe dados básicos | `asset-management.feature` | 🔵 e2e | ✅ | 🟡 Médio |
| Tab "Depreciação" exibe cálculo | `asset-management.feature` | 🔵 e2e | ✅ | 🟡 Médio |
| Tab "Histórico" exibe eventos | `asset-management.feature` | 🔵 e2e | ✅ | 🟡 Médio |
| Tab "Seguro" exibe informações de cobertura | `AssetDetailsPage.tsx` | 🔵 e2e | ⬜ | 🟡 Médio |
| Botões de ação visíveis conforme perfil | `AssetDetailsPage.tsx` | 🔵 e2e | ⬜ | 🟢 Baixo |

### Manutenção

| Cenário | Arquivo | Tipo | Status | Criticidade |
|---------|---------|------|---------|---------|
| Tela de manutenção carrega com ações principais | `maintenance-management.feature` | 🔵 e2e | ✅ | 🟡 Médio |
| Descrição mínima ao criar manutenção | `maintenance-management.feature` | 🔵 e2e | ✅ | 🟢 Baixo |
| Criar e cancelar manutenção | `maintenance-management.feature` | 🔵 e2e | ✅ | 🟠 Alto |
| Criar, iniciar e concluir manutenção | `maintenance-management.feature` | 🔵 e2e | ✅ | 🟠 Alto |
| Filtro por status filtra manutenções | `maintenance-management.feature` | 🔵 e2e | ✅ | 🟡 Médio |
| ADMIN vê botão criar manutenção | `MaintenancePage.tsx` | 🔵 e2e | ⬜ | 🟡 Médio |
| OPERADOR não vê botão criar | `MaintenancePage.tsx` | 🔵 e2e | ⬜ | 🟡 Médio |
| Campo resolução obrigatório na conclusão | `maintenance-management.feature` | 🔵 e2e | ✅ | 🟠 Alto |
| Relatório de orçamento exibe valores | `MaintenancePage.tsx` | 🔵 e2e | ⬜ | 🟡 Médio |

### Transferências

| Cenário | Arquivo | Tipo | Status | Criticidade |
|---------|---------|------|---------|---------|
| Tela de transferências carrega com ações | `transfer-management.feature` | 🔵 e2e | ✅ | 🟡 Médio |
| Validar motivo mínimo ao criar | `transfer-management.feature` | 🔵 e2e | ✅ | 🟢 Baixo |
| Criar e cancelar transferência | `transfer-management.feature` | 🔵 e2e | ✅ | 🟠 Alto |
| Criar, aprovar e concluir transferência | `transfer-management.feature` | 🔵 e2e | ✅ | 🟠 Alto |
| Criar e rejeitar transferência | `transfer-management.feature` | 🔵 e2e | ✅ | 🟠 Alto |
| Filtro por status filtra transferências | `transfer-management.feature` | 🔵 e2e | ✅ | 🟡 Médio |
| Detalhe exibe informações completas | `transfer-management.feature` | 🔵 e2e | ✅ | 🟡 Médio |
| Paginação funciona | `TransfersPage.tsx` | 🔵 e2e | ⬜ | 🟡 Médio |

### Demais Páginas

| Cenário | Arquivo | Tipo | Status | Criticidade |
|---------|---------|------|---------|---------|
| Dashboard ADMIN carrega AdminDashboard com KPIs | `DashboardPage.tsx` | 🔵 e2e | ⬜ | 🟡 Médio |
| Dashboard GESTOR carrega com dados da unidade | `DashboardPage.tsx` | 🔵 e2e | ⬜ | 🟡 Médio |
| Dashboard OPERADOR carrega seus ativos | `DashboardPage.tsx` | 🔵 e2e | ⬜ | 🟡 Médio |
| Página de usuários — ADMIN cria usuário | `UsersPage.tsx` | 🔵 e2e | ⬜ | 🟢 Baixo |
| Página de usuários — GESTOR não vê criar | `UsersPage.tsx` | 🔵 e2e | ⬜ | 🟢 Baixo |
| Página de usuários — bloquear usuário | `UsersPage.tsx` | 🔵 e2e | ⬜ | 🟢 Baixo |
| Página de organizações — ADMIN cria | `OrganizationsPage.tsx` | 🔵 e2e | ⬜ | 🟢 Baixo |
| Página de unidades — ADMIN/GESTOR criam | `UnitsPage.tsx` | 🔵 e2e | ⬜ | 🟢 Baixo |
| Página de auditoria — filtros por tipo e período | `AuditPage.tsx` | 🔵 e2e | ⬜ | 🟡 Médio |
| Página de inventário — GESTOR cria e inicia sessão | `InventoryPage.tsx` | 🔵 e2e | ⬜ | 🟢 Baixo |
| Página de relatórios — exportar CSV | `ReportsPage.tsx` | 🔵 e2e | ⬜ | 🟠 Alto |
| Página AI Insights — executar análise | `AIInsightsPage.tsx` | 🔵 e2e | ⬜ | 🟢 Baixo |
| Página de ativação — processar token e definir senha | `ActivateAccountPage.tsx` | 🔵 e2e | ⬜ | 🔴 Crítico |
| ProtectedRoute redireciona não autenticado para /login | `ProtectedRoute.tsx` | 🔵 e2e | ⬜ | 🔴 Crítico |

---

## 21 · Frontend — Hooks e Serviços de API

`✅ 0 existentes · ⬜ 22 ausentes`

| Cenário | Arquivo | Tipo | Status | Criticidade |
|---------|---------|------|---------|---------|
| useAuth.login envia credenciais e armazena token | `useAuth.ts` | 🟢 unitário | ⬜ | 🔴 Crítico |
| useAuth.verifyMfa envia código MFA e retorna sucesso | `useAuth.ts` | 🟢 unitário | ⬜ | 🔴 Crítico |
| useAuth.logout remove tokens do localStorage | `useAuth.ts` | 🟢 unitário | ⬜ | 🔴 Crítico |
| useAuth.refresh renova accessToken expirado | `useAuth.ts` | 🟢 unitário | ⬜ | 🔴 Crítico |
| useAuth.isAdmin calcula corretamente | `useAuth.ts` | 🟢 unitário | ⬜ | 🟢 Baixo |
| useAuth.isGestor calcula corretamente | `useAuth.ts` | 🟢 unitário | ⬜ | 🟢 Baixo |
| useAssets.load retorna lista paginada | `useAssets.ts` | 🟢 unitário | ⬜ | 🟢 Baixo |
| useAssets.load com erro atribui message ao error state | `useAssets.ts` | 🟢 unitário | ⬜ | 🟢 Baixo |
| useAssets.create cria novo ativo | `useAssets.ts` | 🟢 unitário | ⬜ | 🟢 Baixo |
| useAssets.assign atribui ativo a usuário | `useAssets.ts` | 🟢 unitário | ⬜ | 🔴 Crítico |
| useAssets.unassign remove atribuição | `useAssets.ts` | 🟢 unitário | ⬜ | 🟢 Baixo |
| useAssets.retire apossenta ativo | `useAssets.ts` | 🟢 unitário | ⬜ | 🔴 Crítico |
| useUsers retorna lista paginada de usuários | `useUsers.ts` | 🟢 unitário | ⬜ | 🟢 Baixo |
| assetApi.list executa GET /assets com parâmetros | `index.ts (api)` | 🟢 unitário | ⬜ | 🟢 Baixo |
| assetApi.create executa POST /assets com body correto | `index.ts (api)` | 🟢 unitário | ⬜ | 🟢 Baixo |
| assetApi.retire executa PATCH /assets/{id}/retire | `index.ts (api)` | 🟢 unitário | ⬜ | 🔴 Crítico |
| assetApi.assign executa PATCH correto | `index.ts (api)` | 🟢 unitário | ⬜ | 🟢 Baixo |
| maintenanceApi.create executa POST /maintenance | `index.ts (api)` | 🟢 unitário | ⬜ | 🟢 Baixo |
| maintenanceApi.start executa POST /maintenance/{id}/start | `index.ts (api)` | 🟢 unitário | ⬜ | 🟢 Baixo |
| maintenanceApi.complete executa POST /maintenance/{id}/complete | `index.ts (api)` | 🟢 unitário | ⬜ | 🟢 Baixo |
| transferApi.create executa POST /transfers | `index.ts (api)` | 🟢 unitário | ⬜ | 🟢 Baixo |
| aiInsightsApi.analyze dispara análise e retorna ID | `aiInsights.ts` | 🟢 unitário | ⬜ | 🟢 Baixo |
