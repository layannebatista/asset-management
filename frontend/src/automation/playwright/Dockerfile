# =============================================================================
# Runner de testes E2E Playwright + Cucumber BDD
# Contexto de build: ./frontend/src/automation/playwright
# Os resultados Allure são escritos em /allure-results (via ALLURE_RESULTS_DIR)
# =============================================================================
FROM node:20.19-bookworm

WORKDIR /app

# Instala dependências Node (postinstall já baixa o Chromium)
COPY package.json package-lock.json ./
RUN npm ci

# Instala dependências de sistema necessárias para o Chromium
RUN npx playwright install-deps chromium

# Copia apenas os arquivos de teste (node_modules já instalado acima)
COPY cucumber.js tsconfig.json ./
COPY features ./features
COPY step-definitions ./step-definitions
COPY support ./support

ENV PWHEADLESS=true
# Garante que os resultados vão para o volume compartilhado com o Allure
ENV ALLURE_RESULTS_DIR=/allure-results

CMD ["npm", "test"]
