# 📊 Sprint Reporter - Guia Completo

## 📖 Índice

1. [Visão Geral](#visão-geral)
2. [Acessando o Dashboard](#acessando-o-dashboard)
3. [Gerando Relatórios](#gerando-relatórios)
4. [Exportando para PowerPoint](#exportando-para-powerpoint)
5. [Arquitetura](#arquitetura)
6. [Configuração](#configuração)
7. [API REST](#api-rest)
8. [Troubleshooting](#troubleshooting)

---

## Visão Geral

O **Sprint Reporter** é um gerador automatizado de relatórios de sprint que:

- ✅ **Coleta dados** de múltiplas fontes (testes, CI/CD, IA)
- ✅ **Gera análises inteligentes** com detecção automática de problemas
- ✅ **Cria apresentações profissionais** em PowerPoint
- ✅**Fornece interface web visual** para interação intuitiva

### Principais Características

- 📊 **Dashboard interativo** no navegador
- 📋 **Relatórios em tempo real** com métricas abrangentes
- 💾 **Exportação PowerPoint** com design profissional
- 🎯 **Período flexível** - selecione qualquer intervalo de datas
- 🔄 **Coleta paralela** - dados de 3 fontes simultaneamente
- 🎨 **Linguagem descomplicada** - apresentações fáceis de entender
- 🏆 **Recomendações automáticas** baseadas em análises inteligentes

---

## Acessando o Dashboard

### Pré-requisitos

- Docker Compose em execução (`docker compose up`)
- OU servidor Sprint Reporter rodando localmente (`npm run dev`)

### Como Acessar

1. **Abra seu navegador**
2. **Digite na barra de endereço**: `http://localhost:3200`
3. **O dashboard carregará automaticamente**

### Navegação do Dashboard

```
┌─────────────────────────────────────────┐
│  🔧 PAINEL DE CONTROLE (Esquerda)      │
├─────────────────────────────────────────┤
│                                         │
│  📅 Data de Início                      │
│  📅 Data de Fim                         │
│  📝 Nome do Projeto                     │
│  🔵 Botão "Gerar Relatório"             │
│  📥 Botão "Baixar PowerPoint"           │
│  ⚠️ Área de Erros                       │
│                                         │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  📊 ÁREA DE RELATÓRIO (Direita)        │
├─────────────────────────────────────────┤
│                                         │
│  📈 Resumo Executivo                    │
│  🧪 Métricas de Testes                  │
│  🔄 Pipeline CI/CD                      │
│  🤖 Inteligência Artificial             │
│  ⚡ Performance                         │
│  💚 Saúde da Sprint                     │
│  ⚠️ Problemas Identificados             │
│  💡 Recomendações                       │
│  📊 Insights Principais                 │
│                                         │
└─────────────────────────────────────────┘
```

---

## Gerando Relatórios

### Passo a Passo

1. **Selecione a data de início**
   - Clique no campo "Data de Início"
   - Escolha o primeiro dia da sprint

2. **Selecione a data de fim**
   - Clique no campo "Data de Fim"
   - Escolha o último dia da sprint

3. **Defina o projeto**
   - Digite o nome do projeto (ex: "asset-management")
   - O campo já vem preenchido com o padrão

4. **Clique em "Gerar Relatório"**
   - O sistema começará a coletar dados
   - Uma animação de carregamento aparecerá
   - O relatório será exibido após 5-15 segundos

### O Que Aparecerá

#### 📊 Resumo Executivo

Visão geral rápida com:
- **Status Geral**: Verde (Bom), Amarelo (Atenção), Vermelho (Crítico)
- **Testes**: Quantidade total executada
- **Taxa de Sucesso**: Porcentagem de testes passando
- **Deployments**: Número de releases durante a sprint

#### 🧪 Métricas de Testes

- Breakdown por tipo (Unitários, Integração, E2E)
- Gráficos de distribuição
- Testes instáveis detectados
- Taxa de sucesso

#### 🔄 Pipeline CI/CD

- Total de execuções
- Taxa de sucesso
- Tempo médio de execução
- Status de jobs individuais

#### 🤖 Inteligência Artificial

- Análises executadas
- Qualidade média das análises
- Tokens economizados
- Economia financeira

#### ⚡ Performance

- Latência de requisições
- Taxa de erro
- Distribuição de percentis
- Dados de testes Playwright

#### 💚 Saúde da Sprint

- Indicadores principais
- Checklist de qualidade
- Contagem de problemas por severidade

#### ⚠️ Problemas Identificados

Listagem de issues detectadas automaticamente:
- 🔴 **Críticos**: Requerem atenção imediata
- 🟡 **Avisos**: Devem ser abordados em breve

#### 💡 Recomendações

Ações práticas para melhorar:
- Prioridade (Alta, Média, Baixa)
- Esforço estimado
- Descrição clara da ação

#### 📈 Insights Principais

Padrões e observações sobre:
- Qualidade de testes
- Performance
- Inteligência artificial
- Tendências

---

## Exportando para PowerPoint

### Como Baixar a Apresentação

1. **Gere um relatório** (veja seção anterior)
2. **Clique em "📥 Baixar PowerPoint"**
3. **O arquivo será baixado** como `sprint-report-DATA.pptx`
4. **Abra com**: PowerPoint, Keynote, Google Slides ou LibreOffice

### Estrutura da Apresentação (10 Slides)

#### Slide 1: Capa

```
╔════════════════════════════════════╗
║   RELATÓRIO DE SPRINT             ║
║   ASSET MANAGEMENT                ║
║   01/04/2026 a 14/04/2026         ║
║   ✓ BOM                           ║
╚════════════════════════════════════╝
```

- Título do projeto
- Período analisado
- Status visual com cor de fundo

#### Slide 2: Resumo Executivo

- Cards com status geral
- Quantidade de testes
- Taxa de sucesso
- Problemas detectados
- Recomendações rápidas

#### Slide 3: Métricas de Testes

- Gráficos de distribuição (unitários, integração, E2E)
- Taxa de sucesso
- Testes instáveis
- Breakdown visual

#### Slide 4: Pipeline CI/CD

- Tabela de execuções
- Taxa de sucesso por job
- Tempo médio
- Status de cada ferramenta

#### Slide 5: Inteligência Artificial

- Análises executadas
- Qualidade média
- Economia de tokens
- Box destaque de economia financeira

#### Slide 6: Performance

- Latência (min, média, P95, P99, máx)
- Taxa de erro
- Dados Playwright
- Gráficos de distribuição

#### Slide 7: Saúde da Sprint

- Gauge de status visual
- Contador de problemas
- Checklist de qualidade
- Indicadores

#### Slide 8: Problemas Identificados

- Lista com cards coloridos
- Cada problema com:
  - Severidade (crítico/aviso)
  - Título
  - Descrição
  - Contexto

#### Slide 9: Recomendações

- Cards com ações sugeridas
- Prioridade visível
- Esforço estimado
- Justificativa clara

#### Slide 10: Insights Principais

- Padrões observados
- Análises principais
- Trends e observações
- Recomendações estratégicas

### Design da Apresentação

A apresentação foi desenvolvida com:

- 🎨 **Cores profissionais**: Azul (#1F4E78), Verde (#00B050)
- 📊 **Gráficos claros**: Barras, distribuições, percentis
- 📌 **Ícones visuais**: Para fácil identificação
- 🔤 **Tipografia clara**: Calibri, em português BR
- 💫 **Design moderno**: Shadows, rounded corners, spacing
- 🎯 **Layout responsivo**: Bem distribuído em slides 16:9

### Usando a Apresentação

```
1️⃣  Abra o arquivo no PowerPoint
2️⃣  Comece pela Capa (Slide 1)
3️⃣  Apresente o Resumo Executivo (Slide 2)
4️⃣  Detálhe por área de interesse
5️⃣  Finalize com Insights (Slide 10)
6️⃣  Use Slide Show (F5) para apresentar
7️⃣  Salve como PDF para distribuir
```

---

## Arquitetura

### Componentes

```
┌──────────────────────────────────────────┐
│         NAVEGADOR (Frontend)             │
├──────────────────────────────────────────┤
│  • Dashboard HTML/CSS/JavaScript         │
│  • Formulário de seleção de datas       │
│  • Visualização de métricas             │
│  • Botão de download PowerPoint         │
└────────────┬─────────────────────────────┘
             │ HTTP/REST API
┌────────────▼─────────────────────────────┐
│      EXPRESS SERVER (Port 3200)          │
├──────────────────────────────────────────┤
│  POST /api/reports/sprint                │
│  POST /api/reports/export/powerpoint     │
│  GET / (serve dashboard)                 │
│  GET /health                             │
└────────────┬─────────────────────────────┘
             │ Coleta Paralela
    ┌────────┼────────┬─────────────┐
    │        │        │             │
┌───▼──┐ ┌──▼──┐ ┌───▼─────┐ ┌───▼────┐
│Allure│ │GitHub│ │PostgreSQL│ │Análise │
│Tests │ │ API  │ │AI Metrics│ │Inteligente│
└──────┘ └──────┘ └─────────┘ └────────┘
```

### Fluxo de Dados

```
1. Usuário acessa dashboard
   ↓
2. Seleciona período e projeto
   ↓
3. Clica "Gerar Relatório"
   ↓
4. Servidor inicia coleta paralela:
   • AllureCollector (testes)
   • GitHubCollector (CI/CD)
   • PostgreSQLCollector (IA)
   ↓
5. ReportGenerator processa dados:
   • Extrai métricas
   • Detecta problemas
   • Gera recomendações
   • Identifica insights
   ↓
6. Formatação:
   • JSONFormatter (para API)
   • PowerPointFormatter (para apresentação)
   ↓
7. Exibição no navegador
   ↓
8. Usuário clica "Baixar PowerPoint"
   ↓
9. Sistema gera .pptx profissional
   ↓
10. Arquivo é baixado pelo navegador
```

---

## Configuração

### Variáveis de Ambiente

```env
# Servidor
PORT=3200
NODE_ENV=production

# Banco de Dados PostgreSQL
DB_HOST=postgres
DB_PORT=5432
DB_NAME=asset_management
DB_USER=asset_user
DB_PASSWORD=asset123

# GitHub API
GITHUB_TOKEN=seu_token_aqui
GITHUB_OWNER=layanne
GITHUB_REPO=asset-management

# Resultados Allure
ALLURE_RESULTS_PATH=./allure-results

# Logging
LOG_LEVEL=info
```

### Arquivo `.env.example`

Já existe no repositório. Para usar:

```bash
cp .env.example .env
# Edite .env conforme necessário
```

### Docker Compose

No `docker-compose.yml`, o serviço está configurado como:

```yaml
sprint-reporter:
  build: ./sprint-reporter
  ports:
    - "3200:3200"
  environment:
    - DB_HOST=postgres
    - DB_USER=${DB_USERNAME}
    - DB_PASSWORD=${DB_PASSWORD}
    - GITHUB_TOKEN=${GITHUB_TOKEN}
  volumes:
    - ./allure-results:/app/allure-results
  depends_on:
    - postgres
  networks:
    - asset-net
```

---

## API REST

### Endpoints Disponíveis

#### 1. Health Check

```
GET /health
```

**Resposta:**
```json
{
  "success": true,
  "timestamp": "2026-04-21T10:30:00Z"
}
```

#### 2. Gerar Relatório

```
POST /api/reports/sprint
Content-Type: application/json
```

**Request:**
```json
{
  "startDate": "2026-04-01",
  "endDate": "2026-04-14",
  "projectName": "asset-management",
  "format": "json"
}
```

**Parâmetros:**
- `startDate` (obrigatório): Data início (YYYY-MM-DD)
- `endDate` (obrigatório): Data fim (YYYY-MM-DD)
- `projectName` (obrigatório): Nome do projeto
- `format` (opcional): `json` ou `html` (padrão: `json`)

**Resposta (JSON):**
```json
{
  "timestamp": "2026-04-21T10:30:00Z",
  "period": {
    "startDate": "2026-04-01",
    "endDate": "2026-04-14",
    "projectName": "asset-management",
    "daysCount": 13
  },
  "health": {
    "status": "good",
    "issuesCount": 2,
    "criticalCount": 0,
    "warningCount": 2
  },
  "summary": { /* ... */ },
  "tests": { /* ... */ },
  "cicd": { /* ... */ },
  "ai": { /* ... */ },
  "performance": { /* ... */ },
  "issues": [ /* ... */ ],
  "recommendations": [ /* ... */ ],
  "insights": [ /* ... */ ]
}
```

#### 3. Exportar PowerPoint

```
POST /api/reports/export/powerpoint
Content-Type: application/json
```

**Request:**
```json
{
  "timestamp": "2026-04-21T10:30:00Z",
  "period": { /* ... */ },
  "health": { /* ... */ },
  // ... resto do relatório SprintReport
}
```

**Resposta:**
- Arquivo binário `.pptx` (apresentação PowerPoint)
- Header: `Content-Type: application/vnd.openxmlformats-officedocument.presentationml.presentation`

---

## Troubleshooting

### Dashboard não carrega

**Problema:** Página em branco ao acessar `http://localhost:3200`

**Soluções:**

1. Verifique se o serviço está rodando:
   ```bash
   curl http://localhost:3200/health
   ```

2. Verificar logs do Docker:
   ```bash
   docker logs sprint-reporter
   ```

3. Porém pode estar ocupada:
   ```bash
   # Windows: liberar porta
   netstat -ano | findstr :3200
   taskkill /PID <PID> /F
   ```

### Relatório não gera

**Problema:** Erro ao clicar "Gerar Relatório"

**Possíveis causas:**

1. **Banco de dados offline**
   - Verifique se PostgreSQL está rodando
   - `docker compose ps`

2. **GitHub token inválido**
   - Regenere em: `Settings > Developer settings > Personal tokens`
   - Atualize `.env`

3. **Allure results vazio**
   - Execute testes: `npm run test`
   - Verificar `./allure-results/` tem arquivos

4. **Data inválida**
   - Verifique formato: `YYYY-MM-DD`
   - Start date deve ser antes de end date

### PowerPoint não baixa

**Problema:** Botão "Baixar PowerPoint" desabilitado

**Causa:** Você precisa gerar um relatório primeiro

**Solução:**
1. Clique "Gerar Relatório"
2. Aguarde conclusão
3. Botão será habilitado automaticamente

### Apresentação vazia

**Problema:** Arquivo .pptx gerado mas sem conteúdo

**Solução:**
1. Gere novamente (dados podem estar incompletos)
2. Verifique se todos os coletores funcionam:
   - Allure: `ls allure-results/`
   - GitHub: Repositório configurado
   - PostgreSQL: AI Intelligence rodando

### Performance lenta

**Problema:** Geração de relatório demora muito

**Tempo esperado:**
- Coleta de dados: 3-8 segundos
- Processamento: 2-5 segundos
- PowerPoint: 2-5 segundos
- **Total esperado: 5-15 segundos**

Se exceder 30 segundos:
1. Aumentar período gera mais dados
2. Pode estar esperando GitHub API
3. Verifique conexão de internet

---

## Casos de Uso

### 1. Relatório Semanal

```bash
# Domingo para domingo
# Start: domingo anterior
# End: domingo atual
```

Abra no PowerPoint e apresente na reunião de segunda.

### 2. Análise Entre Sprints

Selecione intervalo de 2-3 sprints para comparar trends.

### 3. Post-Mortem de Incidente

Selecione 2-3 dias ao redor do incidente para análise.

### 4. Demonstração para Stakeholders

Gere, exporte em PowerPoint, converta para PDF e compartilhe.

---

## Suporte

Para dúvidas ou problemas:

1. Verifique este guia
2. Consulte logs: `docker logs sprint-reporter`
3. Reporte em: `https://github.com/layannebatista/asset-management/issues`

---

**Última atualização:** 21 de abril de 2026  
**Versão:** 1.0.0  
**Linguagem:** Português Brasileiro (PT-BR)
