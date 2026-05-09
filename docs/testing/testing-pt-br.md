# Testes

Os testes existem para dar confiança de que regras de negócio, API e interface continuam funcionando.

## Tipos de teste

| Tipo | Ferramenta | O que valida |
|---|---|---|
| Unitário backend | JUnit | Regras isoladas |
| Integração backend | JUnit/Spring | API, banco e serviços juntos |
| BDD backend | Cucumber | Cenários de negócio |
| E2E frontend | Playwright/Cucumber | Fluxos reais na interface |
| Performance | k6 | Latência, carga e erros |
| Relatório | Allure | Visualização dos resultados |

## Rodar tudo

```powershell
./scripts/run-all-tests-docker.ps1 -Build
```

Sem cache:

```powershell
./scripts/run-all-tests-docker.ps1 -Build -NoCache
```

Depois acesse:

```text
http://localhost:5252
```

## Backend

Use testes de backend para:

- regra de negócio de ativos;
- autorização por perfil;
- isolamento multi-tenant;
- validações de entrada;
- persistência e histórico.

## Frontend

Use testes E2E para fluxos que o usuário realmente faz:

- login;
- listar ativos;
- cadastrar/editar ativo;
- transferir ativo;
- executar inventário;
- validar mensagens de erro importantes.

Prefira seletores estáveis como `data-testid`.

## Performance

Use k6 para entender:

- tempo de resposta;
- taxa de erro;
- comportamento sob carga;
- gargalos em endpoints críticos.

## Allure

Allure junta resultados e facilita leitura por área. Se o relatório não atualizar:

1. Confirme se os testes geraram resultados.
2. Reinicie o serviço Allure.
3. Verifique volumes e diretórios configurados.

## Quando adicionar teste

Adicione ou atualize testes quando:

- criar endpoint;
- mudar regra de permissão;
- alterar fluxo de ativo;
- mexer em login/MFA/token;
- alterar schema;
- corrigir bug importante.

## Troubleshooting rápido

| Sintoma | Verifique |
|---|---|
| Teste E2E falha intermitente | espera por elemento, dados iniciais, seletor instável |
| Backend falha no Docker | banco saudável, migração, variável de ambiente |
| Allure vazio | pasta de resultados e serviço Allure |
| k6 sem dados no Grafana | InfluxDB e configuração de saída |

