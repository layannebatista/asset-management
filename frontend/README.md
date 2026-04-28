# Frontend - Asset Management

## Objetivo
Aplicacao web React + Vite para operacao do sistema de gestao de ativos.

## Requisitos
- Node.js 20+
- npm 10+

## Comandos
- Instalar dependencias:
  - `npm install`
- Rodar em desenvolvimento:
  - `npm run dev`
- Build de producao:
  - `npm run build`
- Preview local do build:
  - `npm run preview`
- Lint:
  - `npm run lint`

## Configuracao
A aplicacao usa chamadas HTTP para o backend e IA. Verifique:
- URL do backend exposta para o navegador (padrao local: `http://localhost:8080`)
- Servicos auxiliares quando necessarios para dashboards

## Estrutura Principal
- `src/api/`: configuracao de clientes HTTP e endpoints
- `src/components/`: componentes reutilizaveis
- `src/pages/`: telas da aplicacao
- `src/context/`: estado global (autenticacao e sessao)
- `src/automation/playwright/`: automacao E2E

## Fluxo Operacional Minimo
1. Inicie backend e servicos de apoio (Docker Compose).
2. Inicie o frontend com `npm run dev`.
3. Acesse `http://localhost:5173`.
4. Valide login e fluxos principais (ativos, manutencao, transferencia, dashboard).

## Observacoes
- Relatorios Allure do frontend sao gerados em `frontend/allure-results/`.
- Arquivos de build (`dist/`) sao gerados localmente e nao devem ser versionados.
